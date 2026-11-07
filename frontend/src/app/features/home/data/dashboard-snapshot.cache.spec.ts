import { DashboardSnapshotCache } from './dashboard-snapshot.cache';

describe('DashboardSnapshotCache', () => {
  let store: Map<string, string>;
  let cache: DashboardSnapshotCache;

  beforeEach(() => {
    store = new Map();
    const fakeStorage = {
      get length() { return store.size; },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key)
    };
    Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage, configurable: true });
    cache = new DashboardSnapshotCache();
  });

  it('guarda y lee el snapshot de un widget con su fetchedAt', () => {
    cache.write('u1', 'form', { wins: 3 }, 1000);
    expect(cache.read('u1', 'form')).toEqual({ data: { wins: 3 }, fetchedAt: 1000 });
  });

  it('un widget sin snapshot devuelve null', () => {
    expect(cache.read('u1', 'form')).toBeNull();
  });

  it('los widgets de un mismo usuario conviven', () => {
    cache.write('u1', 'form', 1, 1);
    cache.write('u1', 'debt', 2, 2);
    expect(cache.read<number>('u1', 'form')?.data).toBe(1);
    expect(cache.read<number>('u1', 'debt')?.data).toBe(2);
  });

  it('los snapshots no se mezclan entre usuarios', () => {
    cache.write('u1', 'form', 1, 1);
    expect(cache.read('u2', 'form')).toBeNull();
  });

  it('clear borra solo al usuario indicado', () => {
    cache.write('u1', 'form', 1, 1);
    cache.write('u2', 'form', 2, 2);
    cache.clear('u1');
    expect(cache.read('u1', 'form')).toBeNull();
    expect(cache.read('u2', 'form')).not.toBeNull();
  });

  it('clearAll borra a todos los usuarios y respeta claves ajenas', () => {
    cache.write('u1', 'form', 1, 1);
    cache.write('u2', 'form', 2, 2);
    store.set('ovaltrack.live-match-visits', '{}');
    cache.clearAll();
    expect(cache.read('u1', 'form')).toBeNull();
    expect(cache.read('u2', 'form')).toBeNull();
    expect(store.has('ovaltrack.live-match-visits')).toBeTrue();
  });

  it('con contenido corrupto responde como si no hubiera snapshot', () => {
    store.set('ovaltrack.home-snapshot:u1', '{no es json');
    expect(cache.read('u1', 'form')).toBeNull();
  });
});
