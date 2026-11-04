import { MatchTimelineEventResponse } from '../../types/event.types';
import { MatchReviewStore } from './match-review.store';

/**
 * Edición del tiempo de un evento desde el inspector: la zona se vuelve a derivar, el evento se reordena
 * y la hora de video se estima sin tomarse a sí mismo como referencia. Corre en Node (el store no usa inject()).
 */
describe('MatchReviewStore · edición del tiempo', () => {
  let store: MatchReviewStore;

  const event = (id: string, matchTime: number, overrides: Partial<MatchTimelineEventResponse> = {}): MatchTimelineEventResponse =>
    ({ id, eventTypeId: 't', eventTypeName: 'Tackle', matchTime, period: 1, teamPossession: 'OWN', ...overrides });
  const tramo = { id: 'z', matchId: 'm', period: 1 as const, startMinute: 10, endMinute: 20, row: 2, col: 4 };

  beforeEach(() => {
    store = new MatchReviewStore();
  });

  it('sin cambio de tiempo conserva la zona que informó el servidor', () => {
    store.setEvents([event('a', 600, { zone: { row: 1, col: 1 } })]);
    store.setZoneAssignments([tramo]);

    store.updateEvent('a', { note: 'sin cambio de tiempo' });

    expect(store.allViewModels()[0].zone).toEqual({ row: 1, col: 1 });
  });

  it('al cambiar el tiempo descarta la zona del servidor y la deriva de los tramos', () => {
    store.setEvents([event('a', 600, { zone: { row: 1, col: 1 } })]);
    store.setZoneAssignments([tramo]);

    store.updateEvent('a', { matchTime: 660 });
    expect(store.allViewModels()[0].zone).toEqual({ row: 2, col: 4 });

    store.updateEvent('a', { matchTime: 1500 });
    expect(store.allViewModels()[0].zone).toBeNull();
  });

  it('al cambiar el período también se vuelve a derivar la zona', () => {
    store.setEvents([event('a', 660, { zone: { row: 2, col: 4 } })]);
    store.setZoneAssignments([tramo]);

    store.updateEvent('a', { period: 2, matchTime: 2700 });

    expect(store.allViewModels()[0].zone).toBeNull();
  });

  it('el evento se reordena con su nuevo tiempo', () => {
    store.setEvents([event('a', 600), event('b', 900)]);

    store.updateEvent('a', { matchTime: 1000 });

    expect(store.visibleEvents().map(vm => vm.id)).toEqual(['b', 'a']);
  });

  it('la hora de video de un evento movido no se estima a partir de sí mismo', () => {
    store.setEvents([
      event('a', 300, { absoluteMatchTime: 320 }),
      event('b', 600, { absoluteMatchTime: 900 })
    ]);

    // Con b de referencia: 610 + 300 = 910; sin él, el previo es a: 610 + 20 = 630
    expect(store.estimateAbsoluteTime(610, 1)).toBe(910);
    expect(store.estimateAbsoluteTime(610, 1, 'b')).toBe(630);
  });
});
