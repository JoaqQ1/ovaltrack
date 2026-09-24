import Dexie, { Table } from 'dexie';
import { LIVE_CAPTURE_EVENT_TYPES } from './live-capture.mock';
import { MOCK_MATCHES } from './match.mock';
import {
  LiveCaptureEventType,
  LiveCapturePersistedState,
  LocalMatchEvent,
} from '../types/live-capture.types';
import { Match } from '../types/match.types';

export const MATCH_DATABASE_NAME = 'ovaltrack';
export const MATCH_DATABASE_VERSION = 2;
export const LIVE_CAPTURE_DATABASE_NAME = 'ovaltrack-live-capture';
export const LIVE_CAPTURE_DATABASE_VERSION = 4;

export class MatchDatabase extends Dexie {
  matches!: Table<Match, string>;

  constructor() {
    super(MATCH_DATABASE_NAME);
    this.version(MATCH_DATABASE_VERSION).stores({ matches: 'id' });
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
  await Promise.all([seedMissingMatches(), seedEventTypes()]);
}

export async function seedMissingMatches(): Promise<void> {
  const existingMatches = await matchDatabase.matches.toArray();
  const normalizedMatches = existingMatches.map(match => ({
    ...match,
    id: isUuid(match.id) ? match.id : crypto.randomUUID(),
    divisionId: match.divisionId ?? TEMPORARY_DIVISION_ID,
  }));
  const knownIds = new Set(normalizedMatches.map(match => match.id));
  const missingMatches = MOCK_MATCHES.filter(match => !knownIds.has(match.id));

  await matchDatabase.transaction('rw', matchDatabase.matches, async () => {
    for (const [index, match] of existingMatches.entries()) {
      const normalizedMatch = normalizedMatches[index];
      if (normalizedMatch.id !== match.id) {
        await matchDatabase.matches.delete(match.id);
      }
    }

    if (normalizedMatches.length > 0 || missingMatches.length > 0) {
      await matchDatabase.matches.bulkPut([...normalizedMatches, ...missingMatches]);
    }
  });
}

export async function seedEventTypes(): Promise<void> {
  const existingEventTypes = await liveCaptureDatabase.eventTypes.toArray();
  const knownIds = new Set(existingEventTypes.map(eventType => eventType.id));
  const missingEventTypes = LIVE_CAPTURE_EVENT_TYPES.filter(eventType => !knownIds.has(eventType.id));

  if (missingEventTypes.length > 0) {
    await liveCaptureDatabase.eventTypes.bulkPut(missingEventTypes);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const TEMPORARY_DIVISION_ID = '11111111-1111-1111-1111-000000000020';