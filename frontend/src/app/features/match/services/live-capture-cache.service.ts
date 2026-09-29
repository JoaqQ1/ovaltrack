import { Injectable } from '@angular/core';
import {
  liveCaptureDatabase,
  matchDatabase,
  seedEventTypes,
} from '../data/local-databases';
import { LiveCapturePersistedState, LiveCaptureQuery } from '../types/live-capture.types';
import { LiveCaptureEventType } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
import { Match } from '../types/match.types';

@Injectable({ providedIn: 'root' })
export class LiveCaptureCacheService {
  getMatches(): Promise<Match[]> {
    return matchDatabase.matches.toArray();
  }

  getMatch(matchId: string): Promise<Match | undefined> {
    return matchDatabase.matches.get(matchId);
  }

  saveMatches(matches: Match[]): Promise<void> {
    return matchDatabase.matches.bulkPut(matches).then(() => undefined);
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
    return seedEventTypes().then(() => Promise.all([
      liveCaptureDatabase.states.get(query.matchId),
      this.getEventTypes(),
      liveCaptureDatabase.events.where('matchId').equals(query.matchId).sortBy('localSequence'),
    ])).then(([persistedState, eventTypes, events]) => ({ persistedState, eventTypes, events }));
  }

  saveState(state: LiveCapturePersistedState): Promise<void> {
    return liveCaptureDatabase.states.put(state).then(() => undefined);
  }

  saveEvent(event: LocalMatchEvent): Promise<LocalMatchEvent> {
    return liveCaptureDatabase.events.put(event).then(() => event);
  }

  deleteEvent(eventId: string): Promise<void> {
    return liveCaptureDatabase.events.delete(eventId);
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