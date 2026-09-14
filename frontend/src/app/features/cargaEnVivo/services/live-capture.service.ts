import { Injectable, inject } from '@angular/core';
import { Observable, defer, forkJoin, from, map, switchMap } from 'rxjs';
import {
  LiveCaptureBootstrap,
  LiveCapturePersistedState,
  LiveCaptureQuery,
  LocalMatchEvent,
  Match,
  MatchStatus,
  NewMatchDraft
} from '../types/live-capture.types';
import { LIVE_CAPTURE_EVENT_TYPES } from '../data/live-capture.mock';
import { MOCK_MATCHES } from '../data/match.mock';

const MATCH_DATABASE_NAME = 'ovaltrack';
const MATCH_DATABASE_VERSION = 2;
const MATCH_STORE_NAME = 'matches';
export const TEMPORARY_DIVISION_ID = '550e8400-e29b-41d4-a716-446655440001';
const LIVE_CAPTURE_DATABASE_NAME = 'ovaltrack-live-capture';
const LIVE_CAPTURE_DATABASE_VERSION = 2;
const LIVE_CAPTURE_STATE_STORE = 'states';
const LIVE_CAPTURE_EVENT_TYPES_STORE = 'event-types';
const LIVE_CAPTURE_EVENTS_STORE = 'events';
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
  getLiveCaptureBootstrap(query: LiveCaptureQuery): Observable<LiveCaptureBootstrap> {
    return defer(() => from(this.readBootstrap(query)));
  }

  saveLiveCaptureState(state: LiveCapturePersistedState): Observable<void> {
    return defer(() => from(this.writeState(state)));
  }

  saveEvent(event: LocalMatchEvent): Observable<LocalMatchEvent> {
    return defer(() => from(this.writeEvent(event)));
  }

  deleteEvent(eventId: string): Observable<void> {
    return defer(() => from(this.removeEvent(eventId)));
  }

  getMatchStatus(matchId: string): Observable<MatchStatus> {
    return defer(() => from(this.readLiveCaptureStatus(matchId)));
  }

  private async readBootstrap(query: LiveCaptureQuery): Promise<LiveCaptureBootstrap> {
    const match = await this.readMatch(query.matchId);
    const resolvedQuery = {
      ...query,
      divisionId: match?.divisionId ?? query.divisionId,
    };
    const database = await this.openLiveCaptureDatabase();
    const [persistedState, eventTypes, events] = await Promise.all([
      this.readState(database, query.matchId),
      this.readEventTypes(database),
      this.readEvents(database, query.matchId),
    ]);
    database.close();

    return {
      query: resolvedQuery,
      state: {
        homeTeam: HOME_TEAM_NAME,
        awayTeam: match?.opponent ?? 'Rival',
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

  private readMatch(matchId: string): Promise<Match | undefined> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(MATCH_DATABASE_NAME, MATCH_DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(MATCH_STORE_NAME)) {
          const store = database.createObjectStore(MATCH_STORE_NAME, { keyPath: 'id' });
          MOCK_MATCHES.forEach(match => store.add(match));
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        const readRequest = database.transaction(MATCH_STORE_NAME, 'readonly')
          .objectStore(MATCH_STORE_NAME).get(matchId);
        readRequest.onsuccess = () => {
          resolve(readRequest.result as Match | undefined);
          database.close();
        };
        readRequest.onerror = () => {
          reject(readRequest.error);
          database.close();
        };
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async writeState(state: LiveCapturePersistedState): Promise<void> {
    const database = await this.openLiveCaptureDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(LIVE_CAPTURE_STATE_STORE, 'readwrite')
        .objectStore(LIVE_CAPTURE_STATE_STORE).put(state);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    database.close();
  }

  private readState(database: IDBDatabase, matchId: string): Promise<LiveCapturePersistedState | undefined> {
    return new Promise((resolve, reject) => {
      const request = database.transaction(LIVE_CAPTURE_STATE_STORE, 'readonly')
        .objectStore(LIVE_CAPTURE_STATE_STORE).get(matchId);
      request.onsuccess = () => resolve(request.result as LiveCapturePersistedState | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private readEventTypes(database: IDBDatabase): Promise<LiveCaptureBootstrap['eventTypes']> {
    return new Promise((resolve, reject) => {
      const request = database.transaction(LIVE_CAPTURE_EVENT_TYPES_STORE, 'readonly')
        .objectStore(LIVE_CAPTURE_EVENT_TYPES_STORE).getAll();
      request.onsuccess = () => resolve(request.result as LiveCaptureBootstrap['eventTypes']);
      request.onerror = () => reject(request.error);
    });
  }

  private readEvents(database: IDBDatabase, matchId: string): Promise<LocalMatchEvent[]> {
    return new Promise((resolve, reject) => {
      const request = database.transaction(LIVE_CAPTURE_EVENTS_STORE, 'readonly')
        .objectStore(LIVE_CAPTURE_EVENTS_STORE).getAll();
      request.onsuccess = () => resolve(
        (request.result as LocalMatchEvent[])
          .filter(event => event.matchId === matchId)
          .sort((first, second) => first.localSequence - second.localSequence),
      );
      request.onerror = () => reject(request.error);
    });
  }

  private readLiveCaptureStatus(matchId: string): Promise<MatchStatus> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(LIVE_CAPTURE_DATABASE_NAME, LIVE_CAPTURE_DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(LIVE_CAPTURE_STATE_STORE)) {
          database.createObjectStore(LIVE_CAPTURE_STATE_STORE, { keyPath: 'matchId' });
        }
        if (!database.objectStoreNames.contains(LIVE_CAPTURE_EVENT_TYPES_STORE)) {
          database.createObjectStore(LIVE_CAPTURE_EVENT_TYPES_STORE, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(LIVE_CAPTURE_EVENTS_STORE)) {
          database.createObjectStore(LIVE_CAPTURE_EVENTS_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(
          [LIVE_CAPTURE_STATE_STORE, LIVE_CAPTURE_EVENTS_STORE],
          'readonly',
        );
        const stateRequest = transaction.objectStore(LIVE_CAPTURE_STATE_STORE).get(matchId);
        const eventsRequest = transaction.objectStore(LIVE_CAPTURE_EVENTS_STORE).getAll();

        transaction.oncomplete = () => {
          const state = stateRequest.result as LiveCapturePersistedState | undefined;
          const events = (eventsRequest.result as LocalMatchEvent[])
            .filter(event => event.matchId === matchId);
          resolve(this.resolveMatchStatus(state, events));
          database.close();
        };
        transaction.onerror = () => {
          reject(transaction.error);
          database.close();
        };
      };
      request.onerror = () => reject(request.error);
    });
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

  private openLiveCaptureDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(LIVE_CAPTURE_DATABASE_NAME, LIVE_CAPTURE_DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(LIVE_CAPTURE_STATE_STORE)) {
          database.createObjectStore(LIVE_CAPTURE_STATE_STORE, { keyPath: 'matchId' });
        }
        if (!database.objectStoreNames.contains(LIVE_CAPTURE_EVENT_TYPES_STORE)) {
          const store = database.createObjectStore(LIVE_CAPTURE_EVENT_TYPES_STORE, { keyPath: 'id' });
          LIVE_CAPTURE_EVENT_TYPES.forEach(eventType => store.add(eventType));
        }
        if (!database.objectStoreNames.contains(LIVE_CAPTURE_EVENTS_STORE)) {
          database.createObjectStore(LIVE_CAPTURE_EVENTS_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private writeEvent(event: LocalMatchEvent): Promise<LocalMatchEvent> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(LIVE_CAPTURE_DATABASE_NAME, LIVE_CAPTURE_DATABASE_VERSION);
      request.onsuccess = () => {
        const database = request.result;
        const writeRequest = database.transaction(LIVE_CAPTURE_EVENTS_STORE, 'readwrite')
          .objectStore(LIVE_CAPTURE_EVENTS_STORE).put(event);
        writeRequest.onsuccess = () => {
          database.close();
          resolve(event);
        };
        writeRequest.onerror = () => {
          database.close();
          reject(writeRequest.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
  }

  private removeEvent(eventId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(LIVE_CAPTURE_DATABASE_NAME, LIVE_CAPTURE_DATABASE_VERSION);
      request.onsuccess = () => {
        const database = request.result;
        const deleteRequest = database.transaction(LIVE_CAPTURE_EVENTS_STORE, 'readwrite')
          .objectStore(LIVE_CAPTURE_EVENTS_STORE).delete(eventId);
        deleteRequest.onsuccess = () => {
          database.close();
          resolve();
        };
        deleteRequest.onerror = () => {
          database.close();
          reject(deleteRequest.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Acceso a los datos de partidos.
 *
 * Persiste los partidos localmente en IndexedDB y expone una interfaz
 * asíncrona basada en `Observable`, lista para sustituirse por un backend
 * cuando exista el endpoint correspondiente.
 */
@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly liveCaptureService = inject(LiveCaptureService);

  /** Trae el listado de partidos. */
  getMatches(): Observable<Match[]> {
    return defer(() => from(this.seedMissingMatches().then(() => this.readMatches()))).pipe(
      switchMap(matches => forkJoin(
        matches.map(match => this.liveCaptureService.getMatchStatus(match.id)),
      ).pipe(
        map(statuses => matches.map((match, index) => ({
          ...match,
          status: statuses[index],
        }))),
      )),
    );
  }

  /**
   * Da de alta un partido nuevo a partir de los datos mínimos (fecha y
   * oponente), asignándole id y arrancando siempre en estado "no iniciado".
   */
  createMatch(draft: NewMatchDraft): Observable<Match> {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: draft.date,
      divisionId: TEMPORARY_DIVISION_ID,
      opponent: draft.opponent.trim(),
      status: 'not_started',
    };

    return defer(() => from(this.saveMatch(newMatch)));
  }

  deleteMatch(matchId: string): Observable<void> {
    return defer(() => from(this.removeMatch(matchId)));
  }

  private readMatches(): Promise<Match[]> {
    return this.withStore('readonly', store => {
      return new Promise<Match[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as Match[]);
        request.onerror = () => reject(request.error);
      });
    });
  }

  private seedMissingMatches(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(MATCH_DATABASE_NAME, MATCH_DATABASE_VERSION);

      request.onupgradeneeded = event => {
        const database = request.result;
        const store = database.objectStoreNames.contains(MATCH_STORE_NAME)
          ? request.transaction!.objectStore(MATCH_STORE_NAME)
          : database.createObjectStore(MATCH_STORE_NAME, { keyPath: 'id' });

        if ((event as IDBVersionChangeEvent).oldVersion === 0) {
          MOCK_MATCHES.forEach(match => store.add(match));
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(MATCH_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(MATCH_STORE_NAME);

        MOCK_MATCHES.forEach(match => {
          const lookup = store.get(match.id);
          lookup.onsuccess = () => {
            if (!lookup.result) {
              store.add(match);
            }
          };
        });

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
  }

  private saveMatch(match: Match): Promise<Match> {
    return this.withStore('readwrite', store => {
      return new Promise<Match>((resolve, reject) => {
        const request = store.put(match);
        request.onsuccess = () => resolve(match);
        request.onerror = () => reject(request.error);
      });
    });
  }

  private removeMatch(matchId: string): Promise<void> {
    return this.withStore('readwrite', store => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(matchId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  private withStore<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request = indexedDB.open(MATCH_DATABASE_NAME, MATCH_DATABASE_VERSION);

      request.onupgradeneeded = event => {
        const database = request.result;
        const store = database.objectStoreNames.contains(MATCH_STORE_NAME)
          ? request.transaction!.objectStore(MATCH_STORE_NAME)
          : database.createObjectStore(MATCH_STORE_NAME, { keyPath: 'id' });

        if ((event as IDBVersionChangeEvent).oldVersion === 0) {
          MOCK_MATCHES.forEach(match => store.add(match));
          return;
        }

        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) {
            return;
          }

          const match = cursor.value as Match;
          const migratedMatch = {
            ...match,
            id: this.isUuid(match.id) ? match.id : crypto.randomUUID(),
            divisionId: match.divisionId ?? TEMPORARY_DIVISION_ID,
          };

          if (migratedMatch.id !== match.id) {
            cursor.delete();
            store.put(migratedMatch);
          } else if (!match.divisionId) {
            store.put(migratedMatch);
          }

          cursor.continue();
        };
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(MATCH_STORE_NAME, mode);
        operation(transaction.objectStore(MATCH_STORE_NAME)).then(resolve, reject)
          .finally(() => database.close());
      };
      request.onerror = () => reject(request.error);
    });
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}