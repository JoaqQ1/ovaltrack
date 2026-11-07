import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError, from } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Match } from '../types/match.types';
import { AvailablePlayer, MatchRosterPlayer, RosterPayload, SavedRoster } from '../types/roster.types';
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
        return this.getDivisionPlayers(match.divisionId);
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

  /** Trae los jugadores de la división y los deja en Dexie para el modo offline. */
  getDivisionPlayers(divisionId: string): Observable<AvailablePlayer[]> {
    return this.http.get<AvailablePlayer[]>(`${environment.apiUrl}/division/${divisionId}/players`).pipe(
      switchMap(players =>
        from(this.cache.savePersonsByDivisionId(players.map(p => ({ ...p, divisionId })))).pipe(map(() => players))
      )
    );
  }

  saveRoster(payload: RosterPayload): Observable<void> {
    return this.http.post<void>(`${this.matchesUrl}/${payload.matchId}/roster`, {
      titulares: payload.titulares,
      suplentes: payload.suplentes,
    });
  }

  getSavedRoster(matchId: string): Observable<SavedRoster | null> {
    return this.getMatchRosterPlayers(matchId).pipe(
      map(players => ({
        startingPlayers: players
          .filter(player => player.role === 'TITULAR')
          .map(player => this.toRosterEntry(player)),
        substitutePlayers: players
          .filter(player => player.role === 'SUPLENTE')
          .map(player => this.toRosterEntry(player)),
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

  getMatchRosterPlayers(matchId: string): Observable<MatchRosterPlayer[]> {
    return this.http.get<MatchRosterPlayer[]>(
      `${this.matchesUrl}/${matchId}/roster/players`
    ).pipe(
      catchError(error => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  getRosterOrDivisionPlayers(matchId: string): Observable<MatchRosterPlayer[]> {
    return this.getMatchRosterPlayers(matchId).pipe(
      switchMap(players => players.length > 0
        ? of(players)
        : this.getAvailablePlayers(matchId).pipe(
          map(available => available
            .filter(player => player.jerseyNumber != null)
            .map(player => ({
              id: player.id,
              fullName: player.fullName,
              position: player.position,
              number: player.jerseyNumber!,
              role: 'TITULAR' as const,
              fieldStatus: 'EN_CANCHA' as const,
              fieldSlot: null,
              slotOrder: null,
            })))
        ))
    );
  }

  private toRosterEntry(player: MatchRosterPlayer) {
    return {
      playerId: player.id,
      number: player.number,
      role: player.role,
      fieldStatus: player.fieldStatus,
      fieldSlot: player.fieldSlot,
      slotOrder: player.slotOrder,
    };
  }
}