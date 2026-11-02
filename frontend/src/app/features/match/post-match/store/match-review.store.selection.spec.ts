import { MatchTimelineEventResponse } from '../../types/event.types';
import { MatchReviewStore } from './match-review.store';

/**
 * Caracterización (C0.3) del ciclo de selección de MatchReviewStore: selectNext/PrevVisible y selectNext/PrevPending.
 * Corre en Node (el store no usa inject()), así que prueba los métodos reales y no una copia. Red previa a 11d (cycleSelection).
 */
describe('MatchReviewStore · ciclo de selección', () => {
  let store: MatchReviewStore;

  const event = (id: string, matchTime: number, overrides: Partial<MatchTimelineEventResponse> = {}): MatchTimelineEventResponse =>
    ({ id, eventTypeId: 't', eventTypeName: 'Tackle', matchTime, period: 1, teamPossession: 'OWN', ...overrides });

  // Visibles (cronológico): e1, e2, e3, e4. Cola de pendientes (propio sin jugador): e1, e3. e2 tiene jugador y e4 es del rival.
  const load = (): void => store.setEvents([
    event('e1', 60),
    event('e2', 120, { playerId: 'p1' }),
    event('e3', 180),
    event('e4', 240, { teamPossession: 'OPPONENT' })
  ]);

  beforeEach(() => {
    store = new MatchReviewStore();
  });

  describe('selectNextVisible', () => {
    beforeEach(load);

    it('sin selección elige el primero', () => {
      store.selectNextVisible();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('avanza al siguiente en orden cronológico', () => {
      store.selectEvent('e1');
      store.selectNextVisible();
      expect(store.selectedEventId()).toBe('e2');
    });

    it('desde el último vuelve al primero', () => {
      store.selectEvent('e4');
      store.selectNextVisible();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('si la selección no está entre los visibles, elige el primero', () => {
      store.selectEvent('inexistente');
      store.selectNextVisible();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('respeta los filtros: lo oculto se saltea y se vuelve al primero visible', () => {
      store.setTeamFilter('OWN');
      store.selectEvent('e3');
      store.selectNextVisible();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('con la selección oculta por un filtro, elige el primero visible', () => {
      store.setTeamFilter('OWN');
      store.selectEvent('e4');
      store.selectNextVisible();
      expect(store.selectedEventId()).toBe('e1');
    });
  });

  describe('selectPrevVisible', () => {
    beforeEach(load);

    it('sin selección elige el último', () => {
      store.selectPrevVisible();
      expect(store.selectedEventId()).toBe('e4');
    });

    it('retrocede al anterior', () => {
      store.selectEvent('e3');
      store.selectPrevVisible();
      expect(store.selectedEventId()).toBe('e2');
    });

    it('desde el primero vuelve al último', () => {
      store.selectEvent('e1');
      store.selectPrevVisible();
      expect(store.selectedEventId()).toBe('e4');
    });

    it('si la selección no está entre los visibles, elige el último', () => {
      store.selectEvent('inexistente');
      store.selectPrevVisible();
      expect(store.selectedEventId()).toBe('e4');
    });

    it('con la selección oculta por un filtro, elige el último visible', () => {
      store.setTeamFilter('OWN');
      store.selectEvent('e4');
      store.selectPrevVisible();
      expect(store.selectedEventId()).toBe('e3');
    });
  });

  describe('selectNextPending', () => {
    beforeEach(load);

    it('sin selección elige el primero de la cola', () => {
      store.selectNextPending();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('avanza dentro de la cola y desde el último vuelve al primero', () => {
      store.selectEvent('e1');
      store.selectNextPending();
      expect(store.selectedEventId()).toBe('e3');

      store.selectNextPending();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('si la selección no está en la cola (tiene jugador), elige el primero', () => {
      store.selectEvent('e2');
      store.selectNextPending();
      expect(store.selectedEventId()).toBe('e1');
    });

    it('la cola no depende de los filtros de la tabla', () => {
      store.setTeamFilter('OPPONENT');
      store.selectEvent('e1');
      store.selectNextPending();
      expect(store.selectedEventId()).toBe('e3');
    });
  });

  describe('selectPrevPending', () => {
    beforeEach(load);

    it('sin selección elige el último de la cola', () => {
      store.selectPrevPending();
      expect(store.selectedEventId()).toBe('e3');
    });

    it('retrocede dentro de la cola y desde el primero vuelve al último', () => {
      store.selectEvent('e3');
      store.selectPrevPending();
      expect(store.selectedEventId()).toBe('e1');

      store.selectPrevPending();
      expect(store.selectedEventId()).toBe('e3');
    });

    it('si la selección no está en la cola, elige el último', () => {
      store.selectEvent('e2');
      store.selectPrevPending();
      expect(store.selectedEventId()).toBe('e3');
    });
  });

  describe('listas vacías', () => {
    it('sin eventos no cambia la selección', () => {
      store.selectEvent('e9');
      store.selectNextVisible();
      store.selectPrevVisible();
      store.selectNextPending();
      store.selectPrevPending();
      expect(store.selectedEventId()).toBe('e9');
    });

    it('con todos asignados la cola está vacía y no cambia la selección', () => {
      store.setEvents([event('e1', 60, { playerId: 'p1' })]);
      store.selectEvent('e1');
      store.selectNextPending();
      store.selectPrevPending();
      expect(store.selectedEventId()).toBe('e1');
    });
  });
});
