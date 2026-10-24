import { Injectable, inject } from '@angular/core';
import { Observable, defer, firstValueFrom, forkJoin, from, map, switchMap, catchError, of } from 'rxjs';
import {
  LiveCaptureBootstrap,
  LiveCaptureEventType,
  LiveCapturePersistedState,
  LiveCaptureQuery,
} from '../types/live-capture.types';
import { BackendEventResponse, LocalMatchEvent } from '../types/event.types';
import { LiveMatchStateRequest, Match, MatchStatus } from '../types/match.types';
import { MatchService } from './match.service';
import { EventService } from './event.service';
import { RosterService } from './roster.service';
import { AvailablePlayer , SavedRoster} from '../types/roster.types';
import { eventTeam } from '../statistics/calculators/event-rules';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { PendingEventSyncService } from '../../../core/synchronization/pending-event-sync.service';

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
  private readonly cache = inject(LocalDatabaseService);
  private readonly matchService = inject(MatchService);
  private readonly eventService = inject(EventService);
  private readonly rosterService = inject(RosterService);
  private readonly pendingEventSync = inject(PendingEventSyncService);
  private readonly startingPlayersByMatch = new Map<string, AvailablePlayer[]>();

  constructor() {
  }

  getLiveCaptureBootstrap(query: LiveCaptureQuery): Observable<LiveCaptureBootstrap> {
    return defer(() => from(this.readBootstrap(query)));
  }

  hydrateMatchEvents(matchId: string): Observable<LocalMatchEvent[]> {
    return this.eventService.getByMatch(matchId).pipe(
      switchMap(remoteEvents => from(this.cache.mergeRemoteEvents(matchId, remoteEvents))),
    );
  }

  saveLiveCaptureState(state: LiveCapturePersistedState): Observable<void> {
    const request: LiveMatchStateRequest = {
      clockElapsedSeconds: state.clockElapsedSeconds,
      clockPaused: state.clockPaused,
      currentPossession: state.currentPossession ?? 'OWN',
    };

    return from(this.cache.saveState(state)).pipe(
      switchMap(() => from(this.cache.getMatch(state.matchId))),
      switchMap(match => {
        if (match) {
          const updatedMatch = {
            ...match,
            clockElapsedSeconds: state.clockElapsedSeconds,
            clockPaused: state.clockPaused,
            clockUpdatedAt: new Date(state.savedAt).toISOString(),
            currentPossession: state.currentPossession ?? match.currentPossession,
          };
          return from(this.cache.saveMatches([updatedMatch]));
        }
        return of(undefined);
      }),
      switchMap(() => this.matchService.updateLiveMatchState(state.matchId, request)),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  saveEvent(event: LocalMatchEvent): Observable<LocalMatchEvent> {
    return from(this.resolvePlayer(event)).pipe(
      switchMap(localEvent => from(this.cache.saveEvent(localEvent))),
      map(savedEvent => ({
        ...savedEvent,
        localSequence: event.localSequence,
      }))
    );
  }

  syncPendingEvents(matchId?: string): Observable<LocalMatchEvent[]> {
    return defer(() => from(this.pendingEventSync.flush(matchId)));
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
    let match: Match;
    let remoteEvents: BackendEventResponse[] | null = null;
    let eventTypes: LiveCaptureEventType[];
    let players: AvailablePlayer[];
    let savedRoster: SavedRoster | null;

    try {
      const remote = await firstValueFrom(forkJoin({
        bootstrap: this.matchService.getLiveMatchBootstrap(query.matchId),
        players: this.rosterService.getAvailablePlayers(query.matchId),
        savedRoster: this.rosterService.getSavedRoster(query.matchId),
      }));
      match = remote.bootstrap.match;
      remoteEvents = remote.bootstrap.events;
      players = remote.players;
      savedRoster = remote.savedRoster;
      eventTypes = remote.bootstrap.eventTypes.map(eventType => ({
        ...eventType,
        groupName: eventType.groupName ?? 'General',
        category: eventType.category ?? 'NEUTRAL',
        points: eventType.points ?? 0,
        createdAt: new Date().toISOString(),
        isActive: true,
      }));
      await this.cache.syncActiveEventTypes(eventTypes);
    } catch {
      const localMatch = await this.cache.getMatch(query.matchId);
      if (!localMatch) {
        throw new Error(`Match ${query.matchId} is unavailable offline`);
      }

      match = localMatch;
      [eventTypes, players, savedRoster] = await Promise.all([
        this.cache.getActiveEventTypes(),
        localMatch.divisionId ? this.cache.getPersonsByDivisionId(localMatch.divisionId) : Promise.resolve([]),
        this.cache.getRoster(query.matchId).then(roster => roster ?? null),
      ]);
    }

    if (match.status === 'cancelled') {
      throw new Error(`Match ${query.matchId} was cancelled`);
    }
    const resolvedQuery = {
      ...query,
      divisionId: match.divisionId,
    };
    const rosterPlayers = this.toStartingPlayers(savedRoster, players);
    this.startingPlayersByMatch.set(query.matchId, rosterPlayers);
    const events = remoteEvents
      ? await this.cache.mergeRemoteEvents(query.matchId, remoteEvents)
      : await this.cache.getEventsByMatch(query.matchId);
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

  private toStartingPlayers(savedRoster: SavedRoster | null, players: AvailablePlayer[]): AvailablePlayer[] {
    return (savedRoster?.startingPlayers ?? [])
      .map(playerId => players.find(player => player.id === playerId))
      .filter((player): player is AvailablePlayer => player !== undefined);
  }

  private async resolvePlayer(event: LocalMatchEvent): Promise<LocalMatchEvent> {
    if (event.playerId) return event;

    const eventTypes = await this.cache.getEventTypes();
    const et = eventTypes.find(t => t.id === event.eventTypeId);
    if (eventTeam(et, event) !== 'OWN') return event;

    const raw = event.attributes?.['playerNumber'];
    if (raw === null || raw === undefined || raw === '') return event;
    const slotNumber = Number(raw);
    if (!Number.isInteger(slotNumber) || slotNumber < 1) return event;

    const startingPlayers = this.startingPlayersByMatch.get(event.matchId)
      ?? await this.readCachedStartingPlayers(event.matchId);
    const player = startingPlayers[slotNumber - 1];

    return player ? { ...event, playerId: player.id } : event;
  }

  private async readCachedStartingPlayers(matchId: string): Promise<AvailablePlayer[]> {
    const [match, savedRoster] = await Promise.all([
      this.cache.getMatch(matchId),
      this.cache.getRoster(matchId),
    ]);
    if (!match?.divisionId || !savedRoster) {
      return [];
    }
    const players = await this.cache.getPersonsByDivisionId(match.divisionId);
    return this.toStartingPlayers(savedRoster, players);
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