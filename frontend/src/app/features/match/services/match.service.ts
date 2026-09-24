import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { Match, NewMatchDraft } from '../types/live-capture.types';
import { TEMPORARY_DIVISION_ID } from '../data/match.constants';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/matches';

  getMatches(): Observable<Match[]> {
    return this.http.get<any[]>(`${this.apiUrl}/division?divisionId=${TEMPORARY_DIVISION_ID}`).pipe(
      map(matches => matches.map(match => ({
        ...match,
        status: match.status.toLowerCase()
      })))
    );
  }

  createMatch(draft: NewMatchDraft): Observable<Match> {
    const formattedDate = draft.date.includes('T')
      ? draft.date
      : `${draft.date}T00:00:00`;

    const payload = {
      date: formattedDate,
      divisionId: TEMPORARY_DIVISION_ID,
      opponent: draft.opponent.trim()
    };

    return this.http.post<any>(`${this.apiUrl}`, payload).pipe(
      map(match => ({
        ...match,
        status: match.status.toLowerCase()
      }))
    );
  }

  deleteMatch(matchId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${matchId}`);
  }

  getAvailablePlayers(matchId: string): Observable<any[]> {
    return this.http.get<Match>(`${this.apiUrl}/${matchId}`).pipe(
      switchMap(match => {
        if (!match) {
          throw new Error(`Partido ${matchId} no encontrado en el backend`);
        }
        return this.http.get<any[]>(`http://localhost:8080/division/${match.divisionId}/players`);
      })
    );
  }

  saveRoster(payload: { matchId: string, startingPlayers: string[], substitutePlayers: string[] }) {
    const dtoParaJava = {
      titularesIds: payload.startingPlayers,
      suplentesIds: payload.substitutePlayers
    };

    return this.http.post(`http://localhost:8080/matches/${payload.matchId}/roster`, dtoParaJava);
  }

  getSavedRoster(matchId: string): Observable<{ startingPlayers: string[], substitutePlayers: string[] } | null> {
    return this.http.get<any>(`http://localhost:8080/matches/${matchId}/roster`).pipe(
      map(response => ({
        startingPlayers: response.startingPlayers || response.titularesIds || [],
        substitutePlayers: response.substitutePlayers || response.suplentesIds || []
      })),
      catchError(error => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      })
    );
  }
}