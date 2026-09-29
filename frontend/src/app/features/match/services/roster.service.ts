import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Match } from '../types/match.types';
import { BackendRosterResponse, RosterPayload, SavedRoster } from '../types/roster.types';

@Injectable({ providedIn: 'root' })
export class RosterService {
  private readonly http = inject(HttpClient);
  private readonly matchesUrl = `${environment.apiUrl}/matches`;

  getAvailablePlayers(matchId: string): Observable<unknown[]> {
    return this.http.get<Match>(`${this.matchesUrl}/${matchId}`).pipe(
      switchMap(match => {
        if (!match) {
          throw new Error(`Partido ${matchId} no encontrado en el backend`);
        }
        return this.http.get<unknown[]>(`${environment.apiUrl}/division/${match.divisionId}/players`);
      })
    );
  }

  saveRoster(payload: RosterPayload): Observable<void> {
    const dto = {
      titularesIds: payload.startingPlayers,
      suplentesIds: payload.substitutePlayers
    };

    return this.http.post<void>(`${this.matchesUrl}/${payload.matchId}/roster`, dto);
  }

  getSavedRoster(matchId: string): Observable<SavedRoster | null> {
    return this.http.get<BackendRosterResponse>(`${this.matchesUrl}/${matchId}/roster`).pipe(
      map(response => ({
        startingPlayers: response.startingPlayers || response.titularesIds || [],
        substitutePlayers: response.substitutePlayers || response.suplentesIds || []
      })),
      catchError(error => error.status === 404 ? of(null) : (() => { throw error; })())
    );
  }
}