import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError, from } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Match } from '../types/match.types';
import { AvailablePlayer, BackendRosterResponse, RosterPayload, SavedRoster, SaveRosterRequestDTO } from '../types/roster.types';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';

@Injectable({ providedIn: 'root' })
export class RosterService {
  private readonly http = inject(HttpClient);
  private readonly matchesUrl = `${environment.apiUrl}/matches`;
  private readonly cache = inject(LocalDatabaseService);
  
  getAvailablePlayers(matchId: string): Observable<AvailablePlayer[]> {
    return this.http.get<Match>(`${this.matchesUrl}/${matchId}`).pipe(
      switchMap(match => {
        if (!match?.divisionId) {
          return throwError(() => new Error(`Partido ${matchId} no encontrado o sin división asignada`));
        }
        return this.http.get<AvailablePlayer[]>(`${environment.apiUrl}/division/${match.divisionId}/players`).pipe(
          switchMap(players =>
            from(this.cache.savePersonsByDivisionId(players.map(p => ({ ...p, divisionId: match.divisionId })))).pipe(map(() => players))
          )
        );
      }),
      catchError(() => 
        from(this.cache.getMatch(matchId)).pipe(
          switchMap(match => {
            if (!match?.divisionId) return of([]);
            return from(this.cache.getPersonsByDivisionId(match.divisionId));
          })
        )
      ) 
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
    return this.http.get<BackendRosterResponse>(
      `${this.matchesUrl}/${matchId}/roster`
    ).pipe(
      map(response => ({
        startingPlayers: response.startingPlayers ?? response.titularesIds ?? [],
        substitutePlayers: response.substitutePlayers ?? response.suplentesIds ?? [],
      })),
      switchMap(roster =>
        from(this.cache.saveRoster(matchId, roster)).pipe(
          map(() => roster)
        )
      ),
      catchError(error => {
        if (error.status === 404) {
          return of(null);
        }

        return from(this.cache.getRoster(matchId)).pipe(
          map(roster => roster ?? null)
        );
      })
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