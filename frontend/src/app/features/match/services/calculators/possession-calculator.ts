import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';
import { calculatePercentage } from './math-utils';

export type PossessionStats = Pick<PeriodStatisticDTO, 'ownPossessionPercentage'>;

/**
 * Calcula el porcentaje de posesión neta para el equipo propio.
 */
export function computePossessionStats(events: LocalMatchEvent[]): PossessionStats {
  const ownPossessionCount = events.filter(e => e.teamPossession === 'OWN').length;
  const opponentPossessionCount = events.filter(e => e.teamPossession === 'OPPONENT').length;
  const total = ownPossessionCount + opponentPossessionCount;

  return {
    ownPossessionPercentage: calculatePercentage(ownPossessionCount, total, 50.0),
  };
}
