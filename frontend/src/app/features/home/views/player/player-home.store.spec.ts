import '@angular/compiler';
import '../../testing/node-globals';
import { Injector, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ConnectivityService } from '../../../../core/services/connectivity.service';
import { UserContextService } from '../../../../core/services/user-context.service';
import { PlayerSummary } from '../../domain/player-summary';
import { WidgetState } from '../../types/home.types';
import { PlayerHomeDataService } from './player-home-data.service';
import { PlayerHomeStore } from './player-home.store';

describe('PlayerHomeStore', () => {
  const NOW = new Date(2026, 10, 6, 21, 0);
  const summary: PlayerSummary = {
    last: {
      matchId: 'm2', dateLabel: 'Dom 1 nov', opponent: 'Draig Goch', ownScore: 22, opponentScore: 14, result: 'win',
      role: 'TITULAR', tries: 1, tackles: 7, slotNumber: 14, analysisPercent: 78
    },
    season: { year: 2026, points: 25, tries: 5, matches: 8, starts: 7, tacklePercent: 81, last: [] }
  };

  let state: WidgetState<PlayerSummary>;
  let injector: Injector & { destroy(): void };

  function createStore(): PlayerHomeStore {
    injector = Injector.create({
      providers: [
        { provide: PlayerHomeDataService, useValue: { summary: (): Observable<WidgetState<PlayerSummary>> => of(state) } },
        { provide: ConnectivityService, useValue: { online: signal(true) } },
        {
          provide: UserContextService,
          useValue: {
            activeDivisions: signal([{ id: 'd1', name: 'M18' }]),
            userContext: signal({ userId: 'u1', firstName: 'Lucas' }),
            currentClub: signal({ name: 'Puerto Madryn RC' })
          }
        },
        { provide: PlayerHomeStore, useClass: PlayerHomeStore, deps: [] }
      ]
    }) as Injector & { destroy(): void };
    const store = injector.get(PlayerHomeStore);
    store.now.set(NOW);
    return store;
  }

  afterEach(() => injector?.destroy());

  it('con un partido jugado: tablero player-last y primario "Ver mi partido"', () => {
    state = { status: 'ready', data: summary, fetchedAt: 1, stale: false };
    const store = createStore();
    store.reload();
    expect(store.board()).toEqual(jasmine.objectContaining({ kind: 'player-last', matchId: 'm2', result: 'win', analysisPercent: 78 }));
    expect(store.primary()).toEqual(jasmine.objectContaining({ kind: 'view-my-match', route: '/player-statistics/m2' }));
  });

  it('sin partidos: onboarding del jugador y ningún primario', () => {
    state = { status: 'empty' };
    const store = createStore();
    store.reload();
    expect(store.board()).toEqual({ kind: 'onboarding', step: 'no-matches-player' });
    expect(store.primary()).toBeNull();
  });

  it('un error no deja ningún primario', () => {
    state = { status: 'error', message: 'No pudimos cargar esto' };
    const store = createStore();
    store.reload();
    expect(store.primary()).toBeNull();
  });

  it('el encabezado trae saludo por hora, división y club', () => {
    state = { status: 'loading' };
    const store = createStore();
    expect(store.hudTitle()).toBe('Buenas noches, Lucas');
    expect(store.hudSubtitle()).toBe('M18 · Puerto Madryn RC');
    expect(store.hudLabel()).toBe('Viernes 6 nov · Mi panel');
  });
});
