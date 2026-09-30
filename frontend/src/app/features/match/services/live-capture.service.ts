import { Injectable, inject } from '@angular/core';
import { Observable, defer, firstValueFrom, forkJoin, from, map, switchMap } from 'rxjs';
import {
  LiveCaptureBootstrap,
  LiveCapturePersistedState,
  LiveCaptureQuery,
} from '../types/live-capture.types';
import { LocalMatchEvent } from '../types/event.types';
import { MatchStatus } from '../types/match.types';
import { LiveCaptureCacheService } from './live-capture-cache.service';
import { MatchService } from './match.service';
import { EventService } from './event.service';
import { EventTypeService } from './event-type.service';
import { RosterService } from './roster.service';
import { AvailablePlayer } from '../types/roster.types';

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
  private readonly eventService = inject(EventService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly rosterService = inject(RosterService);
  private readonly playersByMatch = new Map<string, AvailablePlayer[]>();

  getLiveCaptureBootstrap(query: LiveCaptureQuery): Observable<LiveCaptureBootstrap> {
    return defer(() => from(this.readBootstrap(query)));
  }

  saveLiveCaptureState(state: LiveCapturePersistedState): Observable<void> {
    return defer(() => from(this.cache.saveState(state)));
  }

  saveEvent(event: LocalMatchEvent): Observable<LocalMatchEvent> {
    return this.eventService.createFromLocal(this.resolvePlayer(event)).pipe(
      map(response => ({ ...response, localSequence: event.localSequence })),
      // La caché se actualiza después de una respuesta exitosa del backend.
      switchMap(savedEvent => from(this.cache.saveEvent(savedEvent)).pipe(
        map(() => savedEvent)
      ))
    );
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.eventService.delete(eventId).pipe(
      switchMap(() => from(this.cache.deleteEvent(eventId)))
    );
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
    const { eventTypes, events: backendEvents, players } = await firstValueFrom(forkJoin({
      eventTypes: this.eventTypeService.getAll(),
      events: this.eventService.getByMatch(query.matchId),
      players: this.rosterService.getAvailablePlayers(query.matchId),
    }));
    this.playersByMatch.set(query.matchId, players);
    const events = backendEvents.map((event, index) => ({
      ...event,
      localSequence: index + 1,
    }));
    await Promise.all([
      this.cache.saveEventTypes(eventTypes),
      this.cache.replaceEvents(query.matchId, events),
    ]);
    const { persistedState } = await this.cache.getBootstrapData(query);

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

  private resolvePlayer(event: LocalMatchEvent): LocalMatchEvent {
    if (event.playerId || event.teamPossession !== 'OWN') {
      return event;
    }

    const playerNumber = event.attributes?.['playerNumber'];
    if (typeof playerNumber !== 'number') {
      return event;
    }

    const player = this.playersByMatch.get(event.matchId)
      ?.find(currentPlayer => currentPlayer.jerseyNumber === playerNumber);

    return player ? { ...event, playerId: player.id } : event;
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