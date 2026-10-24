import Dexie, { Table } from 'dexie';
import { LiveCapturePersistedState } from '../match/types/live-capture.types';
import { LiveCaptureEventType } from '../match/types/event-type.types';
import { LocalMatchEvent } from '../match/types/event.types';
import { Match, PendingMatchMutation } from '../match/types/match.types';
import { Division } from '../division/types/division.types';
import { AvailablePlayer, SavedRoster } from '../match/types/roster.types';
import { UserContext } from '../auth/types/auth.types';

export const MATCH_DATABASE_NAME = 'ovaltrack';
export const MATCH_DATABASE_VERSION = 7;
export const LIVE_CAPTURE_DATABASE_NAME = 'ovaltrack-live-capture';
export const LIVE_CAPTURE_DATABASE_VERSION = 4;

export class MatchDatabase extends Dexie {
  userContexts!: Table<UserContext & { cachedAt: number }, string>;
  matches!: Table<Match, string>;
  divisions!: Table<Division, string>;
  rosters!: Table<SavedRoster & { matchId: string }, string>;
  divisionPlayers!: Table<AvailablePlayer & { divisionId: string }, string>;
  pendingMatchMutations!: Table<PendingMatchMutation, string>;

  constructor() {
    super(MATCH_DATABASE_NAME);
    this.version(2).stores({ matches: 'id' });
    this.version(MATCH_DATABASE_VERSION).stores({
      userContexts: 'userId',
      matches: 'id, divisionId',
      divisions: 'id, clubId',
      rosters: 'matchId',
      divisionPlayers: 'id, divisionId, jerseyNumber',
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
  void requestPersistentStorage();
}

async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      const granted = await navigator.storage.persist();
      if (!granted) {
        console.warn('Persistent storage was not granted; offline data may be evicted under storage pressure.');
      }
    }
  } catch (error) {
    console.warn('Could not request persistent storage:', error);
  }
}

