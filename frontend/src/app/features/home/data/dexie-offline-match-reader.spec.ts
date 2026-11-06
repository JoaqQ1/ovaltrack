import { Injector } from '@angular/core';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { LocalMatchEvent } from '../../match/types/event.types';
import { LiveCaptureEventType, LiveCapturePersistedState } from '../../match/types/live-capture.types';
import { Match } from '../../match/types/match.types';
import { AvailablePlayer, SavedRoster } from '../../match/types/roster.types';
import { DexieOfflineMatchReader } from './dexie-offline-match-reader';
import { OfflineMatchReader } from './offline-match-reader';

describe('DexieOfflineMatchReader', () => {
  const match = { id: 'm1', divisionId: 'd1' } as Match;
  let data: {
    match: Partial<Match> | undefined;
    roster: SavedRoster | undefined;
    eventTypes: unknown[];
    players: unknown[];
    events: unknown[];
    state: Partial<LiveCapturePersistedState> | undefined;
  };
  let writes: string[];
  let reader: OfflineMatchReader;

  /** Solo expone lecturas: cualquier escritura del lector fallaría con un TypeError. */
  function buildFakeDatabase() {
    const fake: Record<string, unknown> = {
      getMatch: async () => data.match,
      getRoster: async () => data.roster,
      getActiveEventTypes: async () => data.eventTypes as LiveCaptureEventType[],
      getPersonsByDivisionId: async () => data.players as AvailablePlayer[],
      getEventsByMatch: async () => data.events as LocalMatchEvent[],
      getStatusData: async () => ({ state: data.state, events: [] })
    };
    return new Proxy(fake, {
      get: (target, key: string) => {
        if (/^(save|put|clear|delete|remove|add|update|sync)/.test(key)) writes.push(key);
        return target[key];
      }
    });
  }

  beforeEach(() => {
    writes = [];
    data = {
      match: { id: 'm1' },
      roster: { startingPlayers: ['p1'], substitutePlayers: [] },
      eventTypes: [{}],
      players: [{}],
      events: [],
      state: undefined
    };
    const injector = Injector.create({
      providers: [
        { provide: LocalDatabaseService, useValue: buildFakeDatabase() },
        { provide: DexieOfflineMatchReader, useClass: DexieOfflineMatchReader, deps: [] }
      ]
    });
    reader = injector.get(DexieOfflineMatchReader);
  });

  describe('isReadyOffline', () => {
    it('está listo con partido, nómina, tipos de evento y jugadores', async () => {
      expect(await reader.isReadyOffline(match)).toBeTrue();
    });

    it('no está listo si falta el partido', async () => {
      data.match = undefined;
      expect(await reader.isReadyOffline(match)).toBeFalse();
    });

    it('no está listo si falta la nómina o está vacía', async () => {
      data.roster = undefined;
      expect(await reader.isReadyOffline(match)).toBeFalse();
      data.roster = { startingPlayers: [], substitutePlayers: ['p9'] };
      expect(await reader.isReadyOffline(match)).toBeFalse();
    });

    it('no está listo si faltan los tipos de evento', async () => {
      data.eventTypes = [];
      expect(await reader.isReadyOffline(match)).toBeFalse();
    });

    it('no está listo si faltan los jugadores de la división', async () => {
      data.players = [];
      expect(await reader.isReadyOffline(match)).toBeFalse();
    });

    it('si la lectura falla, no está listo', async () => {
      const failing = Injector.create({
        providers: [
          {
            provide: LocalDatabaseService,
            useValue: {
              getMatch: () => Promise.reject(new Error('idb')),
              getRoster: () => Promise.reject(new Error('idb')),
              getActiveEventTypes: () => Promise.reject(new Error('idb')),
              getPersonsByDivisionId: () => Promise.reject(new Error('idb'))
            }
          },
          { provide: DexieOfflineMatchReader, useClass: DexieOfflineMatchReader, deps: [] }
        ]
      }).get(DexieOfflineMatchReader);
      expect(await failing.isReadyOffline(match)).toBeFalse();
    });
  });

  it('recentEvents devuelve los últimos n, el más reciente primero', async () => {
    data.events = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const events = await reader.recentEvents('m1', 3);
    expect(events.map(event => event.id)).toEqual(['d', 'c', 'b']);
  });

  it('captureProgress devuelve período, reloj y marcador guardados', async () => {
    data.state = { periodLabel: '2T', gameClock: '52:10', scoreboard: { home: 14, away: 7 } };
    expect(await reader.captureProgress('m1')).toEqual({ periodLabel: '2T', gameClock: '52:10', homeScore: 14, awayScore: 7 });
  });

  it('captureProgress es null si el dispositivo nunca capturó el partido', async () => {
    expect(await reader.captureProgress('m1')).toBeNull();
  });

  it('nunca escribe en el almacenamiento', async () => {
    data.events = [{ id: 'a' }];
    data.state = { periodLabel: '1T', gameClock: '10:00' };
    await reader.isReadyOffline(match);
    await reader.recentEvents('m1', 3);
    await reader.captureProgress('m1');
    expect(writes).toEqual([]);
  });
});
