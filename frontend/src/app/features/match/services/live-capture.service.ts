import { Injectable, inject } from '@angular/core';
import { Observable, defer, firstValueFrom, forkJoin, from, map, switchMap } from 'rxjs';
import {
  LiveCaptureBootstrap,
  LiveCapturePersistedState,
  LiveCaptureQuery,
} from '../types/live-capture.types';
import { LocalMatchEvent } from '../types/event.types';
import { LiveMatchStateRequest, MatchStatus } from '../types/match.types';
import { LiveCaptureCacheService } from './live-capture-cache.service';
import { MatchService } from './match.service';
import { EventService } from './event.service';
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
  private readonly rosterService = inject(RosterService);
  private readonly playersByMatch = new Map<string, AvailablePlayer[]>();

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
    const { bootstrap, players, savedRoster } = await firstValueFrom(forkJoin({
      bootstrap: this.matchService.getLiveMatchBootstrap(query.matchId),
      players: this.rosterService.getAvailablePlayers(query.matchId),
      savedRoster: this.rosterService.getSavedRoster(query.matchId),
    }));
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
    const events = bootstrap.events.map((event, index) => ({
      ...event,
      localSequence: index + 1,
    }));
    const eventTypes = bootstrap.eventTypes.map(eventType => ({
      ...eventType,
      groupName: eventType.groupName ?? 'General',
      category: eventType.category ?? 'NEUTRAL',
      points: eventType.points ?? 0,
      active: true,
      createdAt: new Date().toISOString(),
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