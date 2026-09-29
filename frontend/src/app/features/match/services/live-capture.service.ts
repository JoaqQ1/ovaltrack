import { Injectable, inject } from '@angular/core';
import { Observable, defer, firstValueFrom, from } from 'rxjs';
import {
  LiveCaptureBootstrap,
  LiveCapturePersistedState,
  LiveCaptureQuery,
} from '../types/live-capture.types';
import { LocalMatchEvent } from '../types/event.types';
import { MatchStatus } from '../types/match.types';
import { LiveCaptureCacheService } from './live-capture-cache.service';
import { MatchService } from './match.service';

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
  private readonly cache = inject(LiveCaptureCacheService);
  private readonly matchService = inject(MatchService);

  getLiveCaptureBootstrap(query: LiveCaptureQuery): Observable<LiveCaptureBootstrap> {
    return defer(() => from(this.readBootstrap(query)));
  }

  saveLiveCaptureState(state: LiveCapturePersistedState): Observable<void> {
    return defer(() => from(this.cache.saveState(state)));
  }

  saveEvent(event: LocalMatchEvent): Observable<LocalMatchEvent> {
    return defer(() => from(this.cache.saveEvent(event)));
  }

  deleteEvent(eventId: string): Observable<void> {
    return defer(() => from(this.cache.deleteEvent(eventId)));
  }

  deleteMatchData(matchId: string): Observable<void> {
    return defer(() => from(this.cache.deleteMatchData(matchId)));
  }

  getMatchStatus(matchId: string): Observable<MatchStatus> {
    return defer(() => from(this.readLiveCaptureStatus(matchId)));
  }

  private async readBootstrap(query: LiveCaptureQuery): Promise<LiveCaptureBootstrap> {
    const match = await firstValueFrom(this.matchService.getMatchById(query.matchId));
    if (match.status === 'cancelled') {
      throw new Error(`Match ${query.matchId} was cancelled`);
    }
    const resolvedQuery = {
      ...query,
      divisionId: match.divisionId,
    };
    const { persistedState, eventTypes, events } = await this.cache.getBootstrapData(query);

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

  private readLiveCaptureStatus(matchId: string): Promise<MatchStatus> {
    return this.cache.getStatusData(matchId)
      .then(({ state, events }) => this.resolveMatchStatus(state, events));
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

}