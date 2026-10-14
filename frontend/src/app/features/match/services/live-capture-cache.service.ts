import { Injectable } from '@angular/core';
import { liveCaptureDatabase, matchDatabase } from '../data/local-databases';
import { LiveCapturePersistedState, LiveCaptureQuery } from '../types/live-capture.types';
import { LiveCaptureEventType } from '../types/event-type.types';
import { BackendEventResponse, LocalMatchEvent } from '../types/event.types';
import { Match, PendingMatchMutation } from '../types/match.types';
import { Division } from '../../division/types/division.types';
import { SavedRoster } from '../types/roster.types';

@Injectable({ providedIn: 'root' })
export class LiveCaptureCacheService {
  getMatches(): Promise<Match[]> {
    return matchDatabase.matches.toArray();
  }

  getMatch(matchId: string): Promise<Match | undefined> {
    return matchDatabase.matches.get(matchId);
  }

  saveMatches(matches: Match[]): Promise<void> {
    const savedMatches = matches.filter(match => match.status === 'not_started' || match.status === 'in_progress')
    return matchDatabase.matches.bulkPut(savedMatches).then(() => undefined);
  }

  getMatchesByDivision(divisionId: string): Promise<Match[]> {
    return matchDatabase.matches.where('divisionId').equals(divisionId).toArray();
  }

  saveDivisions(divisions: Division[]): Promise<void> {
    return matchDatabase.divisions.bulkPut(divisions).then(() => undefined);
  }

  getDivisionsByClub(clubId: string): Promise<Division[]> {
    return matchDatabase.divisions.where('clubId').equals(clubId).toArray();
  }

  saveRoster(matchId: string, roster: SavedRoster): Promise<void> {
    return matchDatabase.rosters.put({
      matchId,
      startingPlayers: roster.startingPlayers,
      substitutePlayers: roster.substitutePlayers,
    }).then(() => undefined);
  }

  getRoster(matchId: string): Promise<SavedRoster | undefined> {
    return matchDatabase.rosters.get(matchId);
  }

  savePendingMatchMutation(mutation: PendingMatchMutation): Promise<void> {
    return matchDatabase.pendingMatchMutations.put(mutation).then(() => undefined);
  }

  getPendingMatchMutations(): Promise<PendingMatchMutation[]> {
    return matchDatabase.pendingMatchMutations.orderBy('createdAt').toArray();
  }

  deletePendingMatchMutation(id: string): Promise<void> {
    return matchDatabase.pendingMatchMutations.delete(id).then(() => undefined);
  }

  getEventTypes(): Promise<LiveCaptureEventType[]> {
    return liveCaptureDatabase.eventTypes.toArray();
  }

  saveEventTypes(eventTypes: LiveCaptureEventType[]): Promise<void> {
    return liveCaptureDatabase.eventTypes.bulkPut(eventTypes).then(() => undefined);
  }

  getBootstrapData(query: LiveCaptureQuery): Promise<{
    persistedState: LiveCapturePersistedState | undefined;
    eventTypes: LiveCaptureEventType[];
    events: LocalMatchEvent[];
  }> {
    return Promise.all([
      liveCaptureDatabase.states.get(query.matchId),
      this.getEventTypes(),
      liveCaptureDatabase.events.where('matchId').equals(query.matchId).filter(event => event.active).sortBy('localSequence'),
    ]).then(([persistedState, eventTypes, events]) => ({ persistedState, eventTypes, events }));
  }

  saveState(state: LiveCapturePersistedState): Promise<void> {
    return liveCaptureDatabase.states.put(state).then(() => undefined);
  }

  saveEvent(event: LocalMatchEvent): Promise<LocalMatchEvent> {
    return liveCaptureDatabase.events.put(event).then(() => event);
  }

  async mergeRemoteEvents(matchId: string, remoteEvents: BackendEventResponse[]): Promise<LocalMatchEvent[]> {
    await liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      const localEvents = await liveCaptureDatabase.events.where('matchId').equals(matchId).toArray();
      const byLocalId = new Map(localEvents.map(event => [event.id, event]));
      const byBackendId = new Map(
        localEvents
          .filter(event => event.backendEventId)
          .map(event => [event.backendEventId!, event]),
      );
      const byClientId = new Map(
        localEvents
          .filter(event => event.clientEventId)
          .map(event => [event.clientEventId!, event]),
      );
      let nextSequence = localEvents.reduce(
        (highest, event) => Math.max(highest, event.localSequence),
        0,
      );

      for (const remoteEvent of remoteEvents) {
        const localEvent = byBackendId.get(remoteEvent.id)
          ?? (remoteEvent.clientEventId ? byLocalId.get(remoteEvent.clientEventId) : undefined)
          ?? (remoteEvent.clientEventId ? byClientId.get(remoteEvent.clientEventId) : undefined);

        if (localEvent && !localEvent.active && localEvent.synchronizedAt === null && localEvent.backendEventId) {
          continue;
        }

        const event: LocalMatchEvent = {
          ...remoteEvent,
          active: remoteEvent.active ?? true,
          id: localEvent?.id ?? remoteEvent.clientEventId ?? remoteEvent.id,
          backendEventId: remoteEvent.id,
          localSequence: localEvent?.localSequence ?? ++nextSequence,
        };

        await liveCaptureDatabase.events.put(event);
        byLocalId.set(event.id, event);
        byBackendId.set(event.backendEventId!, event);
        if (event.clientEventId) {
          byClientId.set(event.clientEventId, event);
        }
      }
    });

    return this.getEventsByMatch(matchId);
  }

  replaceEvents(matchId: string, events: LocalMatchEvent[]): Promise<void> {
    return liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      await liveCaptureDatabase.events.where('matchId').equals(matchId).delete();
      if (events.length > 0) {
        await liveCaptureDatabase.events.bulkPut(events);
      }
    });
  }

  async deleteEvent(event: LocalMatchEvent): Promise<void> {
    await liveCaptureDatabase.events.update(event.id, {
      active: false,
      synchronizedAt: null,
    });
  }

  getStatusData(matchId: string): Promise<{
    state: LiveCapturePersistedState | undefined;
    events: LocalMatchEvent[];
  }> {
    return Promise.all([
      liveCaptureDatabase.states.get(matchId),
      liveCaptureDatabase.events.where('matchId').equals(matchId).toArray(),
    ]).then(([state, events]) => ({ state, events }));
  }

  getEventsByMatch(matchId: string): Promise<LocalMatchEvent[]> {
    return liveCaptureDatabase.events
      .where('matchId')
      .equals(matchId)
      .filter(event => event.active === true)
      .sortBy('localSequence');
  }

  getPendingEvents(matchId?: string): Promise<LocalMatchEvent[]> {
    const eventsQuery = matchId
      ? liveCaptureDatabase.events.where('matchId').equals(matchId)
      : liveCaptureDatabase.events.toCollection();

    return eventsQuery.toArray().then(events => events
      .filter(event => event.synchronizedAt === null && (event.active || event.backendEventId != null))
      .sort((first, second) => first.localSequence - second.localSequence));
  }

  deleteMatchData(matchId: string): Promise<void> {
    return liveCaptureDatabase.transaction(
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