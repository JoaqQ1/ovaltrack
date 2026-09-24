import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defer, firstValueFrom, forkJoin, from, map, of, switchMap } from 'rxjs';
import {
  liveCaptureDatabase,
  matchDatabase,
  seedEventTypes,
  seedMissingMatches,
} from '../data/local-databases';
import {
  LiveCaptureBootstrap,
  LiveCapturePersistedState,
  LiveCaptureQuery,
  LocalMatchEvent,
  Match,
  MatchStatus,
  NewMatchDraft
} from '../types/live-capture.types';
import { LIVE_CAPTURE_EVENT_TYPES } from '../data/live-capture.mock';
import { MOCK_MATCHES } from '../data/match.mock';
import { HttpClient } from '@angular/common/http'; // 1. Agrega este import arriba de todo

export const TEMPORARY_DIVISION_ID = '11111111-1111-1111-1111-000000000020';
const HOME_TEAM_NAME = 'PMRC';

export const LIVE_CAPTURE_BACKEND_CONTRACT = [
  'Match identification with clubId, divisionId, and matchId.',
  'Initial state with scoreboard, game clock, period, possession, synchronization, and paused clock.',
  'Active event catalog grouped by visual category.',
  'Recent history with minute and interface-readable description.',
  'Event metadata to distinguish scoring, possession, and player requirements.',
] as const;

@Injectable({
  providedIn: 'root',
})
export class LiveCaptureService {
  getLiveCaptureBootstrap(query: LiveCaptureQuery): Observable<LiveCaptureBootstrap> {
    return defer(() => from(this.readBootstrap(query)));
  }

  saveLiveCaptureState(state: LiveCapturePersistedState): Observable<void> {
    return defer(() => from(this.writeState(state)));
  }

  saveEvent(event: LocalMatchEvent): Observable<LocalMatchEvent> {
    return defer(() => from(this.writeEvent(event)));
  }

  deleteEvent(eventId: string): Observable<void> {
    return defer(() => from(this.removeEvent(eventId)));
  }

  deleteMatchData(matchId: string): Observable<void> {
    return defer(() => from(this.removeMatchData(matchId)));
  }

  getMatchStatus(matchId: string): Observable<MatchStatus> {
    return defer(() => from(this.readLiveCaptureStatus(matchId)));
  }

  private async readBootstrap(query: LiveCaptureQuery): Promise<LiveCaptureBootstrap> {
    const match = await this.readMatch(query.matchId);
    if (!match) {
      throw new Error(`Match ${query.matchId} was not found`);
    }
    const resolvedQuery = {
      ...query,
      divisionId: match.divisionId,
    };
    await seedEventTypes();
    const [persistedState, eventTypes, events] = await Promise.all([
      liveCaptureDatabase.states.get(query.matchId),
      liveCaptureDatabase.eventTypes.toArray(),
      liveCaptureDatabase.events.where('matchId').equals(query.matchId).sortBy('localSequence'),
    ]);

    return {
      query: resolvedQuery,
      state: {
        homeTeam: HOME_TEAM_NAME,
        awayTeam: match.opponent,
        scoreboard: { home: 0, away: 0 },
        gameClock: '00:00',
        period: 1,
        periodLabel: 'Inicio',
        clockPaused: true,
        currentPossession: 'OWN',
        synchronized: true,
        history: [],
      },
      recentEvents: events,
      eventTypes,
      persistedState,
    };
  }

  // Asegúrate de inyectar HttpClient si no lo tienes en esta clase
  private readonly http = inject(HttpClient);

  private async readMatch(matchId: string): Promise<Match | undefined> {
    try {
      // Buscamos el partido directamente en PostgreSQL a través de Spring Boot
      const match = await firstValueFrom(
        this.http.get<Match>(`http://localhost:8080/matches/${matchId}`)
      );
      return match;
    } catch (err) {
      // Fallback temporal por si quedó algún dato viejo en Dexie
      return matchDatabase.matches.get(matchId);
    }
  }

  private async writeState(state: LiveCapturePersistedState): Promise<void> {
    await liveCaptureDatabase.states.put(state);
  }

  private readLiveCaptureStatus(matchId: string): Promise<MatchStatus> {
    return Promise.all([
      liveCaptureDatabase.states.get(matchId),
      liveCaptureDatabase.events.where('matchId').equals(matchId).toArray(),
    ]).then(([state, events]) => this.resolveMatchStatus(state, events));
  }

  private resolveMatchStatus(
    state: LiveCapturePersistedState | undefined,
    events: LocalMatchEvent[],
  ): MatchStatus {
    if (state?.period === 3) {
      return 'finished';
    }

    if (events.length > 0 || (state?.clockElapsedSeconds ?? 0) > 0) {
      return 'in_progress';
    }

    return 'not_started';
  }

  private writeEvent(event: LocalMatchEvent): Promise<LocalMatchEvent> {
    return liveCaptureDatabase.events.put(event).then(() => event);
  }

  private removeEvent(eventId: string): Promise<void> {
    return liveCaptureDatabase.events.delete(eventId);
  }

  private async removeMatchData(matchId: string): Promise<void> {
    await liveCaptureDatabase.transaction(
      'rw',
      liveCaptureDatabase.states,
      liveCaptureDatabase.events,
      async () => {
        await liveCaptureDatabase.states.delete(matchId);
        await liveCaptureDatabase.events.where('matchId').equals(matchId).delete();
      },
    );
  }
}

/**
 * Acceso a los datos de partidos.
 *
 * Persiste los partidos localmente mediante Dexie y expone una interfaz
 * asíncrona basada en `Observable`, lista para sustituirse por un backend
 * cuando exista el endpoint correspondiente.
 */
@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  
  // Ajusta el puerto si es distinto a 8080
  private apiUrl = 'http://localhost:8080/matches';

  /** 1. Trae el listado de partidos desde Spring Boot */
  getMatches(): Observable<Match[]> {
    return this.http.get<any[]>(`${this.apiUrl}/division?divisionId=${TEMPORARY_DIVISION_ID}`).pipe(
      map(matches => matches.map(m => ({
        ...m,
        status: m.status.toLowerCase() // Convertimos NOT_STARTED a not_started
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
    
    return this.http.post<any>('http://localhost:8080/matches', payload).pipe(
      map(m => ({
        ...m,
        status: m.status.toLowerCase() // Lo mismo al crear uno nuevo
      }))
    );
  } 

  /** 3. Elimina un partido en el backend */
  deleteMatch(matchId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${matchId}`);
  }

  /** 4. Trae los jugadores de la división para armar el plantel */
  getAvailablePlayers(matchId: string): Observable<any[]> {
    // Primero obtenemos el partido del backend para saber su divisionId
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
    
    // Armamos el objeto con los nombres exactos que espera tu DTO en Java
    const dtoParaJava = {
      titularesIds: payload.startingPlayers,
      suplentesIds: payload.substitutePlayers
    };

    // Enviamos el dtoParaJava en lugar del payload original
    return this.http.post(`http://localhost:8080/matches/${payload.matchId}/roster`, dtoParaJava);
  }

  /** 6. Recupera el plantel guardado al volver a entrar a la pantalla */
  getSavedRoster(matchId: string): Observable<{ startingPlayers: string[], substitutePlayers: string[] } | null> {
    return this.http.get<any>(`http://localhost:8080/matches/${matchId}/roster`)
      .pipe(
        map(res => {
          // Si Java lo manda en inglés o en español, Angular lo adapta
          return {
            startingPlayers: res.startingPlayers || res.titularesIds || [],
            substitutePlayers: res.substitutePlayers || res.suplentesIds || []
          };
        }),
        catchError(err => {
          if (err.status === 404) {
            return of(null);
          }
          throw err;
        })
      );
  }
}