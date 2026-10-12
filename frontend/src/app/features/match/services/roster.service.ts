import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Match } from '../types/match.types';
import { AvailablePlayer, BackendRosterResponse, RosterPayload, SavedRoster, SaveRosterRequestDTO } from '../types/roster.types';

@Injectable({ providedIn: 'root' })
export class RosterService {
  private readonly http = inject(HttpClient);
  private readonly matchesUrl = `${environment.apiUrl}/matches`;

  getAvailablePlayers(matchId: string): Observable<AvailablePlayer[]> {
    return this.http.get<Match>(`${this.matchesUrl}/${matchId}`).pipe(
      switchMap(match => {
        if (!match?.divisionId) {
          return throwError(() => new Error(`Partido ${matchId} no encontrado o sin división asignada`));
        }
        return this.http.get<AvailablePlayer[]>(`${environment.apiUrl}/division/${match.divisionId}/players`);
      })
    );
  }

  saveRoster(payload: RosterPayload): Observable<void> {
    const dto: SaveRosterRequestDTO = {
      titularesIds: payload.startingPlayers,
      suplentesIds: payload.substitutePlayers
    };

    return this.http.post<void>(`${this.matchesUrl}/${payload.matchId}/roster`, dto);
  }

  getSavedRoster(matchId: string): Observable<SavedRoster | null> {
    return this.http.get<BackendRosterResponse>(`${this.matchesUrl}/${matchId}/roster`).pipe(
      map(response => ({
        startingPlayers: response.startingPlayers ?? response.titularesIds ?? [],
        substitutePlayers: response.substitutePlayers ?? response.suplentesIds ?? []
      })),
      catchError(error => error.status === 404 ? of(null) : throwError(() => error))
    );
  }

  /**
   * Obtiene exclusivamente los jugadores que integran el plantel convocado
   * para el partido (titulares 1-15 y suplentes 16-23).
   * Si no hay plantel guardado, recurre a los jugadores de la división.
   */
  getMatchRosterPlayers(matchId: string): Observable<AvailablePlayer[]> {
    return forkJoin({
      allPlayers: this.getAvailablePlayers(matchId).pipe(catchError(() => of([]))),
      savedRoster: this.getSavedRoster(matchId).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ allPlayers, savedRoster }) => {
        if (!savedRoster || (!savedRoster.startingPlayers.length && !savedRoster.substitutePlayers.length)) {
          return allPlayers;
        }

        const matchPlayers: AvailablePlayer[] = [];

        // Titulares (camisetas 1 a 15)
        savedRoster.startingPlayers.forEach((playerId, index) => {
          const found = allPlayers.find(p => p.id === playerId);
          if (found) {
            matchPlayers.push({
              ...found,
              jerseyNumber: found.jerseyNumber ?? (index + 1)
            });
          }
        });

        // Suplentes (camisetas 16 a 23)
        savedRoster.substitutePlayers.forEach((playerId, index) => {
          const found = allPlayers.find(p => p.id === playerId);
          if (found) {
            matchPlayers.push({
              ...found,
              jerseyNumber: found.jerseyNumber ?? (index + 16)
            });
          }
        });

        return matchPlayers;
      })
    );
  }
}