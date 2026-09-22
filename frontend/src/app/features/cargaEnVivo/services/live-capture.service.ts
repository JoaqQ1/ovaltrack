import { Injectable, inject } from '@angular/core';
import { Observable, defer, firstValueFrom, forkJoin, from, map, switchMap } from 'rxjs';
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

export const TEMPORARY_DIVISION_ID = '550e8400-e29b-41d4-a716-446655440001';
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

  private readMatch(matchId: string): Promise<Match | undefined> {
    return seedMissingMatches().then(() => matchDatabase.matches.get(matchId));
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
  private readonly liveCaptureService = inject(LiveCaptureService);

  /** Trae el listado de partidos. */
  getMatches(): Observable<Match[]> {
    return defer(() => from(this.seedMissingMatches().then(() => this.readMatches()))).pipe(
      switchMap(matches => forkJoin(
        matches.map(match => this.liveCaptureService.getMatchStatus(match.id)),
      ).pipe(
        map(statuses => matches.map((match, index) => ({
          ...match,
          status: statuses[index],
        }))),
      )),
    );
  }

  /**
   * Da de alta un partido nuevo a partir de los datos mínimos (fecha y
   * oponente), asignándole id y arrancando siempre en estado "no iniciado".
   */
  createMatch(draft: NewMatchDraft): Observable<Match> {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: draft.date,
      divisionId: TEMPORARY_DIVISION_ID,
      opponent: draft.opponent.trim(),
      status: 'not_started',
    };

    return defer(() => from(this.saveMatch(newMatch)));
  }

  deleteMatch(matchId: string): Observable<void> {
    return defer(() => from(this.removeMatch(matchId)));
  }

  private readMatches(): Promise<Match[]> {
    return matchDatabase.matches.toArray();
  }

  private seedMissingMatches(): Promise<void> {
    return seedMissingMatches();
  }

  private saveMatch(match: Match): Promise<Match> {
    return matchDatabase.matches.put(match).then(() => match);
  }

  private removeMatch(matchId: string): Promise<void> {
    return firstValueFrom(this.liveCaptureService.deleteMatchData(matchId))
      .then(() => matchDatabase.matches.delete(matchId));
  }
}