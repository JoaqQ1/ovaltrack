import { ReviewEventViewModel } from '../types/match-review.types';
import { buildEventPrefill } from './event-prefill';

const event = (period: number, matchTime: number, formatted: string) =>
  ({ period, matchTime, matchTimeFormatted: formatted } as ReviewEventViewModel);

describe('buildEventPrefill', () => {
  it('no precarga nada sin filtro de período ni evento seleccionado', () => {
    expect(buildEventPrefill('ALL', null)).toBeNull();
  });

  it('toma el período del filtro activo', () => {
    const prefill = buildEventPrefill(2, null);
    expect(prefill?.period).toBe(2);
    expect(prefill?.minute).toBeNull();
    expect(prefill?.hints.period).toBe('Del filtro 2T');
  });

  it('sugiere el tiempo del evento seleccionado en 2T con minuto acumulado', () => {
    const prefill = buildEventPrefill('ALL', event(2, 52 * 60 + 10, '52:10'));
    expect(prefill).toEqual({
      period: 2,
      minute: 52,
      second: 10,
      hints: { period: 'Del evento seleccionado', time: 'Del evento seleccionado · 52:10' }
    });
  });

  it('no sugiere el tiempo si el evento es de otro período que el filtro', () => {
    const prefill = buildEventPrefill(1, event(2, 3000, '50:00'));
    expect(prefill?.period).toBe(1);
    expect(prefill?.minute).toBeNull();
    expect(prefill?.hints.time).toBeUndefined();
  });
});
