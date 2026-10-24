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
const DISCIPLINE_CRITICAL_PENALTIES = 6;
const DISCIPLINE_WARNING_PENALTIES = 3;

const NO_DATA: MetricStatus = { label: 'Sin datos', type: 'neutral' };

/** Eventos de un tipo con una opción concreta en un campo select (0 si el tipo no está en la vista). */
function optionCount(stat: EventTypeStat | undefined, key: string, value: string): { own: number; opponent: number } {
  for (const field of stat?.fields ?? []) {
    if (field.kind === 'select' && field.key === key) {
      const option = field.options.find(candidate => candidate.value === value);
      if (option) return option.count;
    }
  }
  return { own: 0, opponent: 0 };
}

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
  {
    id: 'penalties-conceded',
    label: 'Penales concedidos',
    format: 'int',
    requires: ['PENALTY_CONCEDED'],
    // En scrum y line-out el penal queda como resultado: `penalty_against` lo comete quien
    // ejecuta la formación y `penalty_for`, el rival. Solo cuentan si la formación está en la vista.
    compute: stat => {
      const conceded = countOf(stat('PENALTY_CONCEDED'));
      const setPieces = [
        { stat: stat('SCRUM'), key: 'scrumResult' },
        { stat: stat('LINEOUT'), key: 'lineResult' },
      ];
      let own = conceded.own;
      let opponent = conceded.opponent;
      for (const setPiece of setPieces) {
        const against = optionCount(setPiece.stat, setPiece.key, 'penalty_against');
        const favor = optionCount(setPiece.stat, setPiece.key, 'penalty_for');
        own += against.own + favor.opponent;
        opponent += against.opponent + favor.own;
      }
      return { own, opponent };
    },
    assess: (value, stat) => {
      const penalties = value.own ?? 0;
      const yellow = countOf(stat('YELLOW_CARD')).own;
      const red = countOf(stat('RED_CARD')).own;
      if (red > 0 || penalties > DISCIPLINE_CRITICAL_PENALTIES) return { label: 'Crítico', type: 'danger' };
      if (yellow > 0 || penalties > DISCIPLINE_WARNING_PENALTIES) return { label: 'Atención', type: 'warning' };
      return { label: 'Bien', type: 'success' };
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
