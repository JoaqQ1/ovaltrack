import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, defer, firstValueFrom, forkJoin, from, map, switchMap, toArray, catchError, EMPTY } from 'rxjs';
import {
  LiveCaptureBootstrap,
  LiveCaptureBootstrapResponse,
  LiveCapturePersistedState,
  LiveCaptureQuery,
} from '../types/live-capture.types';
import { LocalMatchEvent } from '../types/event.types';
import { LiveMatchStateRequest, MatchStatus } from '../types/match.types';
import { LiveCaptureCacheService } from './live-capture-cache.service';
import { MatchService } from './match.service';
import { EventService } from './event.service';
import { RosterService } from './roster.service';
import { AvailablePlayer , SavedRoster} from '../types/roster.types';

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
  private readonly rosterService = inject(RosterService);
  private readonly playersByMatch = new Map<string, AvailablePlayer[]>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncPendingEvents().subscribe());
      this.syncPendingEvents().subscribe();
    }
  }

  getLiveCaptureBootstrap(query: LiveCaptureQuery): Observable<LiveCaptureBootstrap> {
    return defer(() => from(this.readBootstrap(query)));
  }

  saveLiveCaptureState(state: LiveCapturePersistedState): Observable<void> {
    const request: LiveMatchStateRequest = {
      clockElapsedSeconds: state.clockElapsedSeconds,
      clockPaused: state.clockPaused,
      currentPossession: state.currentPossession ?? 'OWN',
    };

    return this.matchService.updateLiveMatchState(state.matchId, request).pipe(
      map(() => undefined),
    );
  }

  saveEvent(event: LocalMatchEvent): Observable<LocalMatchEvent> {
    const localEvent = this.resolvePlayer(event);

    return from(this.cache.saveEvent(localEvent)).pipe(
      map(savedEvent => ({
        ...savedEvent,
        localSequence: event.localSequence,
      }))
    );
  }

  syncPendingEvents(matchId?: string): Observable<LocalMatchEvent[]> {
    return from(this.cache.getPendingEvents(matchId)).pipe(
      switchMap(events => from(events)),
      concatMap(event => {
        if (!event.active && event.backendEventId != null) {
          return this.eventService.delete(event.backendEventId).pipe(
            switchMap(response => from(this.cache.saveEvent({
              ...event,
              synchronizedAt: response.synchronizedAt,
            }))),
            catchError(() => EMPTY),
          );
        }

        return this.eventService.createFromLocal(event).pipe(
          switchMap(response => {
            const synchronizedEvent: LocalMatchEvent = {
              ...event,
              backendEventId: response.id,
              synchronizedAt: response.synchronizedAt,
            };

            return from(this.cache.saveEvent(synchronizedEvent));
          }),
          catchError(() => EMPTY),
        );
      }),
      toArray(),
    );
  }

  getLocalEvents(matchId: string): Observable<LocalMatchEvent[]> {
    return defer(() => from(this.cache.getEventsByMatch(matchId)));
  }

  deleteEvent(event: LocalMatchEvent): Observable<void> {
    return from(this.cache.deleteEvent(event)).pipe(
      switchMap(() => this.syncPendingEvents(event.matchId)),
      map(() => undefined),
    );
  }

  deleteMatchData(matchId: string): Observable<void> {
    return defer(() => from(this.cache.deleteMatchData(matchId)));
  }

  getMatchStatus(matchId: string): Observable<MatchStatus> {
    return defer(() => from(this.readLiveCaptureStatus(matchId)));
  }

  private async readBootstrap(query: LiveCaptureQuery): Promise<LiveCaptureBootstrap> {
    let bootstrap: LiveCaptureBootstrapResponse;
    let players: AvailablePlayer[];
    let savedRoster: SavedRoster | null;

    try {
      ({ bootstrap, players, savedRoster } = await firstValueFrom(forkJoin({
        bootstrap: this.matchService.getLiveMatchBootstrap(query.matchId),
        players: this.rosterService.getAvailablePlayers(query.matchId),
        savedRoster: this.rosterService.getSavedRoster(query.matchId),
      })));
    } catch {
      const [localMatch, localStatus, localEventTypes] = await Promise.all([
        this.cache.getMatch(query.matchId),
        this.cache.getStatusData(query.matchId),
        this.cache.getEventTypes(),
      ]);

      if (!localMatch) {
        throw new Error(`Match ${query.matchId} is unavailable offline`);
      }

      bootstrap = {
        match: localMatch,
        events: localStatus.events,
        eventTypes: localEventTypes as unknown as LiveCaptureBootstrapResponse['eventTypes'],
      };
      players = [];
      savedRoster = null;
    }
    const match = bootstrap.match;
    if (match.status === 'cancelled') {
      throw new Error(`Match ${query.matchId} was cancelled`);
    }
    const resolvedQuery = {
      ...query,
      divisionId: match.divisionId,
    };
    this.playersByMatch.set(query.matchId, players);
    const rosterIds = new Set([
      ...(savedRoster?.startingPlayers ?? []),
      ...(savedRoster?.substitutePlayers ?? []),
    ]);
    const rosterPlayers = players.filter(player => rosterIds.has(player.id));
    const remoteEvents = bootstrap.events.map((event, index) => ({
      ...event,
      localSequence: index + 1,
    }));
    const localEvents = await this.cache.getEventsByMatch(query.matchId);
    const eventsByClientId = new Map<string, LocalMatchEvent>();

    remoteEvents.forEach(event => {
      eventsByClientId.set(event.clientEventId ?? event.id, event);
    });
    localEvents.forEach(event => {
      eventsByClientId.set(event.id, event);
    });

    const events = Array.from(eventsByClientId.values())
      .sort((first, second) => first.localSequence - second.localSequence);
    const eventTypes = bootstrap.eventTypes.map(eventType => ({
      ...eventType,
      groupName: eventType.groupName ?? 'General',
      category: eventType.category ?? 'NEUTRAL',
      points: eventType.points ?? 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    }));
    const isHalftime = match.status === 'halftime';
    const period = match.currentPeriod ?? 1;
    const periodLabel = isHalftime ? 'Entretiempo' : (period === 2 ? '2T' : '1T');

    return {
      query: resolvedQuery,
      match,
      state: {
        homeTeam: HOME_TEAM_NAME,
        awayTeam: match.opponent,
        scoreboard: {
          home: match.homeScore ?? 0,
          away: match.awayScore ?? 0,
        },
        gameClock: this.formatClock(match.clockElapsedSeconds ?? 0),
        period,
        periodLabel,
        clockPaused: match.clockPaused ?? true,
        clockUpdatedAt: match.clockUpdatedAt,
        currentPossession: match.currentPossession ?? 'OWN',
        synchronized: true,
        isHalftime,
        history: [],
      },
      recentEvents: events,
      eventTypes,
      rosterPlayers,
    };
  }

  private formatClock(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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