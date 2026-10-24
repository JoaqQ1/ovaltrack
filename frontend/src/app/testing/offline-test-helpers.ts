import { HttpRequest } from '@angular/common/http';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { liveCaptureDatabase, matchDatabase } from '../features/local-database/local-databases';
import { BackendMatchResponse, Match } from '../features/match/types/match.types';
import { BackendEventResponse, LocalMatchEvent } from '../features/match/types/event.types';
import { LiveCaptureEventType } from '../features/match/types/event-type.types';

/** Vacía todas las tablas locales para aislar cada spec. */
export async function clearLocalDatabases(): Promise<void> {
  await Promise.all([
    ...matchDatabase.tables.map(table => table.clear()),
    ...liveCaptureDatabase.tables.map(table => table.clear()),
  ]);
}

/**
 * Espera a que se emita una petición HTTP que cumpla el predicado.
 * Las peticiones salen después de lecturas asíncronas de IndexedDB, por lo que
 * `expectOne` inmediato no alcanza.
 */
export async function nextRequest(
  httpMock: HttpTestingController,
  predicate: (request: HttpRequest<unknown>) => boolean,
): Promise<TestRequest> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const [request] = httpMock.match(predicate);
    if (request) {
      return request;
    }
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('Expected HTTP request was never issued');
}

/** Deja correr las promesas y transacciones de IndexedDB pendientes. */
export function settle(ms = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function buildMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    date: '2026-10-23T00:00:00',
    divisionId: 'division-1',
    opponent: 'Rival',
    status: 'in_progress',
    currentPeriod: 1,
    clockElapsedSeconds: 600,
    clockPaused: false,
    currentPossession: 'OWN',
    homeScore: 0,
    awayScore: 0,
    ...overrides,
  };
}

export function buildBackendMatch(overrides: Partial<BackendMatchResponse> = {}): BackendMatchResponse {
  return {
    id: 'match-1',
    date: '2026-10-23T00:00:00',
    divisionId: 'division-1',
    opponent: 'Rival',
    status: 'IN_PROGRESS',
    currentPeriod: 1,
    clockElapsedSeconds: 600,
    clockPaused: false,
    currentPossession: 'OWN',
    homeScore: 0,
    awayScore: 0,
    ...overrides,
  };
}

export function buildLocalEvent(overrides: Partial<LocalMatchEvent> = {}): LocalMatchEvent {
  return {
    id: 'event-1',
    clientEventId: 'event-1',
    eventTypeId: 'event-type-1',
    matchId: 'match-1',
    playerId: null,
    teamPossession: 'OWN',
    matchTime: 120,
    absoluteMatchTime: 120,
    realTime: '2026-10-23T15:00:00',
    period: 1,
    origin: 'live-capture',
    attributes: null,
    createdAt: '2026-10-23T15:00:00',
    synchronizedAt: null,
    active: true,
    backendEventId: null,
    localSequence: 1,
    ...overrides,
  };
}

/** Respuesta del backend para un evento creado a partir de `localEvent`. */
export function buildBackendEventResponse(
  localEvent: LocalMatchEvent,
  overrides: Partial<BackendEventResponse> = {},
): BackendEventResponse {
  const { backendEventId, localSequence, ...fields } = localEvent;
  return {
    ...fields,
    id: backendEventId ?? `backend-${localEvent.id}`,
    clientEventId: localEvent.id,
    synchronizedAt: '2026-10-23T15:00:05',
    ...overrides,
  };
}

export function buildEventType(overrides: Partial<LiveCaptureEventType> = {}): LiveCaptureEventType {
  return {
    id: 'event-type-1',
    name: 'Tackle',
    groupName: 'Defensa',
    category: 'DEFENSE',
    isScoring: false,
    points: 0,
    requiresPlayer: true,
    code: 'TACKLE',
    showInPalette: true,
    followUpEventTypeId: null,
    actor: 'ATTACKING',
    possessionAfter: 'KEEP',
    followUpChoices: [],
    templateEventFields: [],
    isActive: true,
    createdAt: '2026-10-23T15:00:00Z',
    ...overrides,
  };
}
