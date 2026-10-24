import { DerivedMetric, EventTypeStat, MetricFormat, MetricStatus, OptionalTeamValue } from '../types/statistic.types';
import { calculatePercentage } from './math-utils';

/** Estadística de un tipo visible en la vista, por `code`; `undefined` si no está en la vista. */
export type StatLookup = (code: string) => EventTypeStat | undefined;

/**
 * Métrica que combina varios tipos de evento y por eso no se puede derivar del catálogo.
 * Es el único lugar del cálculo que nombra códigos: un tipo nuevo nunca necesita tocar este
 * archivo, solo una métrica combinada nueva.
 */
interface DerivedMetricDefinition {
  id: string;
  label: string;
  format: MetricFormat;
  /** Tipos que tienen que estar visibles en la vista para mostrar la métrica. */
  requires: string[];
  compute(stat: StatLookup): OptionalTeamValue;
  assess?(value: OptionalTeamValue, stat: StatLookup): MetricStatus;
}

const TACKLE_SUCCESS_THRESHOLD = 70;

const NO_DATA: MetricStatus = { label: 'Sin datos', type: 'neutral' };

const countOf = (stat: EventTypeStat | undefined) => stat?.count ?? { own: 0, opponent: 0 };

const DERIVED_METRICS: DerivedMetricDefinition[] = [
  {
    id: 'tackle-effectiveness',
    label: 'Efectividad de tackles',
    format: 'percent',
    requires: ['TACKLE_MADE', 'TACKLE_MISSED'],
    compute: stat => {
      const made = countOf(stat('TACKLE_MADE'));
      const missed = countOf(stat('TACKLE_MISSED'));
      const rate = (part: number, failed: number) =>
        (part + failed > 0 ? calculatePercentage(part, part + failed) : null);
      return { own: rate(made.own, missed.own), opponent: rate(made.opponent, missed.opponent) };
    },
    assess: value => {
      if (value.own === null) return NO_DATA;
      return value.own >= TACKLE_SUCCESS_THRESHOLD
        ? { label: 'Bien', type: 'success' }
        : { label: 'A mejorar', type: 'warning' };
    },
  },
  {
    id: 'turnover-balance',
    label: 'Balance de turnovers',
    format: 'signed',
    requires: ['TURNOVER_WON'],
    // El turnover que gana un equipo es el que pierde el otro.
    compute: stat => {
      const won = countOf(stat('TURNOVER_WON'));
      return { own: won.own - won.opponent, opponent: won.opponent - won.own };
    },
    assess: (value, stat) => {
      const won = countOf(stat('TURNOVER_WON'));
      if (won.own + won.opponent === 0 || value.own === null) return NO_DATA;
      if (value.own > 0) return { label: 'Favorable', type: 'success' };
      if (value.own === 0) return { label: 'Parejo', type: 'neutral' };
      return { label: 'Desfavorable', type: 'warning' };
    },
  },
];

/** Métricas combinadas cuyos tipos requeridos están visibles en la vista. */
export function computeDerivedMetrics(stat: StatLookup): DerivedMetric[] {
  return DERIVED_METRICS
    .filter(definition => definition.requires.every(code => stat(code) !== undefined))
    .map(definition => {
      const value = definition.compute(stat);
      return {
        id: definition.id,
        label: definition.label,
        format: definition.format,
        value,
        status: definition.assess ? definition.assess(value, stat) : null,
      };
    });
}
