import { ReviewEventViewModel, ReviewPeriodFilter } from '../types/match-review.types';

export interface EventPrefillHints {
  period?: string;
  time?: string;
}

export interface EventPrefill {
  period: 1 | 2;
  minute: number | null;
  second: number | null;
  hints: EventPrefillHints;
}

/**
 * Valores iniciales del alta de un evento a partir del contexto de la pantalla:
 * el período viene del filtro activo (o del evento seleccionado) y el tiempo del evento seleccionado.
 * El tiempo solo se sugiere si el evento pertenece al período elegido.
 */
export function buildEventPrefill(
  periodFilter: ReviewPeriodFilter,
  selected: ReviewEventViewModel | null
): EventPrefill | null {
  const selectedPeriod = selected && (selected.period === 1 || selected.period === 2) ? selected.period : null;
  const period = periodFilter !== 'ALL' ? periodFilter : selectedPeriod;
  if (period === null) return null;

  const hints: EventPrefillHints = {
    period: periodFilter !== 'ALL' ? `Del filtro ${period}T` : 'Del evento seleccionado'
  };

  if (!selected || selected.period !== period) {
    return { period, minute: null, second: null, hints };
  }

  const total = Math.max(0, Math.floor(selected.matchTime));
  hints.time = `Del evento seleccionado · ${selected.matchTimeFormatted}`;
  return { period, minute: Math.floor(total / 60), second: total % 60, hints };
}
