import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendMatchResponse, Match, MatchStatus, NewMatchDraft } from '../types/match.types';
import { BackendRosterResponse, RosterPayload, SavedRoster } from '../types/roster.types';
import { TEMPORARY_DIVISION_ID } from '../data/match.constants';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  getMatches(): Observable<Match[]> {
    return this.http.get<BackendMatchResponse[]>(`${this.apiUrl}/division?divisionId=${TEMPORARY_DIVISION_ID}`).pipe(
      map(matches => matches.map(match => ({
        ...match,
        status: this.normalizeStatus(match.status),
        opponent: match.opponent ?? '',
        date: match.date ?? ''
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

    return this.http.post<BackendMatchResponse>(this.apiUrl, payload).pipe(
      map(match => ({
        ...match,
        status: this.normalizeStatus(match.status),
        opponent: match.opponent ?? '',
        date: match.date ?? ''
      }))
    );
  }

  private normalizeStatus(status: BackendMatchResponse['status']): MatchStatus {
    return status.toLowerCase() as MatchStatus;
  }

  deleteMatch(matchId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${matchId}/cancel`);
  }

  getAvailablePlayers(matchId: string): Observable<unknown[]> {
    return this.http.get<Match>(`${this.apiUrl}/${matchId}`).pipe(
      switchMap(match => {
        if (!match) {
          throw new Error(`Partido ${matchId} no encontrado en el backend`);
        }
        return this.http.get<unknown[]>(`${environment.apiUrl}/division/${match.divisionId}/players`);
      })
    );
  }

  saveRoster(payload: RosterPayload): Observable<void> {
    const dtoParaJava = {
      titularesIds: payload.startingPlayers,
      suplentesIds: payload.substitutePlayers
    };

    return this.http.post<void>(`${this.apiUrl}/${payload.matchId}/roster`, dtoParaJava);
  }

  getSavedRoster(matchId: string): Observable<SavedRoster | null> {
    return this.http.get<BackendRosterResponse>(`${this.apiUrl}/${matchId}/roster`).pipe(
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