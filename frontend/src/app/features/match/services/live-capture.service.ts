import { Injectable, inject } from '@angular/core';
import { Observable, defer, firstValueFrom, from } from 'rxjs';
import {
  liveCaptureDatabase,
  matchDatabase,
  seedEventTypes,
} from '../data/local-databases';
import {
  LiveCaptureBootstrap,
  LiveCapturePersistedState,
  LiveCaptureQuery,
  LocalMatchEvent,
  Match,
  MatchStatus,
} from '../types/live-capture.types';
import { HttpClient } from '@angular/common/http';

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