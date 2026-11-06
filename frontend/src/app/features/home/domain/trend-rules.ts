export type TrendTone = 'better' | 'worse' | 'stable';

export interface TrendMetric {
  /** Con `false` (penales) subir es peor. */
  higherIsBetter: boolean;
  /** |Δ| menor a este valor es "estable": 2 p.p. en porcentajes, 1 en conteos, 3 en puntos. */
  stableBelow: number;
}

export const LINEOUT_METRIC: TrendMetric = { higherIsBetter: true, stableBelow: 2 };
export const TACKLE_METRIC: TrendMetric = { higherIsBetter: true, stableBelow: 2 };
export const PENALTIES_METRIC: TrendMetric = { higherIsBetter: false, stableBelow: 1 };
export const POINTS_METRIC: TrendMetric = { higherIsBetter: true, stableBelow: 3 };

export interface Trend {
  latest: number;
  /** Promedio de los partidos anteriores de la temporada. */
  average: number;
  /** Último partido menos el promedio, con 1 decimal. */
  delta: number;
  tone: TrendTone;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Último partido contra el promedio de los anteriores; `null` si no hay con qué comparar. */
export function computeTrend(series: readonly number[], metric: TrendMetric): Trend | null {
  if (series.length < 2) return null;
  const latest = series[series.length - 1];
  const previous = series.slice(0, -1);
  const average = previous.reduce((sum, value) => sum + value, 0) / previous.length;
  const delta = round1(latest - average);
  const tone: TrendTone = Math.abs(delta) < metric.stableBelow
    ? 'stable'
    : (delta > 0) === metric.higherIsBetter ? 'better' : 'worse';
  return { latest, average: round1(average), delta, tone };
}

export type FocusMetricId = 'lineout' | 'tackle' | 'penalties';

export interface FocusItem {
  metric: FocusMetricId;
  tone: 'worse' | 'better';
  delta: number;
}

export interface FocusSeries {
  lineout: readonly number[];
  tackle: readonly number[];
  penalties: readonly number[];
}

/** Con menos partidos que esto no hay alertas: un solo mal día no es tendencia. */
export const FOCUS_MIN_MATCHES = 3;
export const FOCUS_MAX_ITEMS = 3;
const FOCUS_ALERT_PERCENT_DROP = -10;
const FOCUS_ALERT_PENALTIES_RISE = 3;

const FOCUS_METRICS: ReadonlyArray<{ id: FocusMetricId; metric: TrendMetric; isAlert: (delta: number) => boolean }> = [
  { id: 'lineout', metric: LINEOUT_METRIC, isAlert: delta => delta <= FOCUS_ALERT_PERCENT_DROP },
  { id: 'tackle', metric: TACKLE_METRIC, isAlert: delta => delta <= FOCUS_ALERT_PERCENT_DROP },
  { id: 'penalties', metric: PENALTIES_METRIC, isAlert: delta => delta >= FOCUS_ALERT_PENALTIES_RISE }
];

/**
 * "Qué trabajar esta semana": las alertas (line o tackle −10 p.p. o peor, penales +3 o más)
 * y, además, la mejora no estable de mayor |Δ|. Vacío = "Sin desvíos importantes".
 */
export function computeFocus(series: FocusSeries): FocusItem[] {
  const alerts: FocusItem[] = [];
  let bestImprovement: FocusItem | null = null;

  for (const { id, metric, isAlert } of FOCUS_METRICS) {
    const values = series[id];
    if (values.length < FOCUS_MIN_MATCHES) continue;
    const trend = computeTrend(values, metric);
    if (!trend) continue;
    if (isAlert(trend.delta)) {
      alerts.push({ metric: id, tone: 'worse', delta: trend.delta });
    } else if (trend.tone === 'better' && (!bestImprovement || Math.abs(trend.delta) > Math.abs(bestImprovement.delta))) {
      bestImprovement = { metric: id, tone: 'better', delta: trend.delta };
    }
  }

  alerts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return (bestImprovement ? [...alerts, bestImprovement] : alerts).slice(0, FOCUS_MAX_ITEMS);
}
