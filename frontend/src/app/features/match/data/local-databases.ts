import Dexie, { Table } from 'dexie';
import { LIVE_CAPTURE_EVENT_TYPES } from './live-capture.mock';
import { LiveCapturePersistedState } from '../types/live-capture.types';
import { LiveCaptureEventType } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
import { Match, PendingMatchMutation } from '../types/match.types';
import { Division } from '../../division/types/division.types';
import { SavedRoster } from '../types/roster.types';
import { UserContext } from '../../auth/types/auth.types';

export const MATCH_DATABASE_NAME = 'ovaltrack';
export const MATCH_DATABASE_VERSION = 5;
export const LIVE_CAPTURE_DATABASE_NAME = 'ovaltrack-live-capture';
export const LIVE_CAPTURE_DATABASE_VERSION = 4;

export class MatchDatabase extends Dexie {
  userContexts!: Table<UserContext & { cachedAt: number }, string>;
  matches!: Table<Match, string>;
  divisions!: Table<Division, string>;
  rosters!: Table<SavedRoster & { matchId: string }, string>;
  pendingMatchMutations!: Table<PendingMatchMutation, string>;

  constructor() {
    super(MATCH_DATABASE_NAME);
    this.version(2).stores({ matches: 'id' });
    this.version(MATCH_DATABASE_VERSION).stores({
      userContexts: 'userId',
      matches: 'id, divisionId',
      divisions: 'id, clubId',
      rosters: 'matchId',
      pendingMatchMutations: 'id, matchId, action, createdAt',
    });
  }
}

export class LiveCaptureDatabase extends Dexie {
  states!: Table<LiveCapturePersistedState, string>;
  eventTypes!: Table<LiveCaptureEventType, string>;
  events!: Table<LocalMatchEvent, string>;

  constructor() {
    super(LIVE_CAPTURE_DATABASE_NAME);
    this.version(LIVE_CAPTURE_DATABASE_VERSION).stores({
      states: 'matchId',
      eventTypes: 'id',
      events: 'id, matchId',
    });
  }
}

export const matchDatabase = new MatchDatabase();
export const liveCaptureDatabase = new LiveCaptureDatabase();

export async function initializeLocalDatabases(): Promise<void> {
  await seedEventTypes();
}

export async function seedEventTypes(): Promise<void> {
  const existingEventTypes = await liveCaptureDatabase.eventTypes.toArray();
  const knownIds = new Set(existingEventTypes.map(eventType => eventType.id));
  const missingEventTypes = LIVE_CAPTURE_EVENT_TYPES.filter(eventType => !knownIds.has(eventType.id));

  if (missingEventTypes.length > 0) {
    await liveCaptureDatabase.eventTypes.bulkPut(missingEventTypes);
  }
}
