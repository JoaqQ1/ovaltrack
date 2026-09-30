import { LocalMatchEvent } from '../../types/live-capture.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';

export type PossessionStats = Pick<PeriodStatisticDTO, 'ownPossessionPercentage'>;

/**
 * Calcula el porcentaje de posesión neta para el equipo propio.
 */
export function computePossessionStats(events: LocalMatchEvent[]): PossessionStats {
  let ownPossessionCount = 0;
  let opponentPossessionCount = 0;

  for (const event of events) {
    if (event.teamPossession === 'OWN') {
      ownPossessionCount++;
    } else if (event.teamPossession === 'OPPONENT') {
      opponentPossessionCount++;
    }
  }

  const total = ownPossessionCount + opponentPossessionCount;
  const ownPossessionPercentage = total > 0
    ? Math.round(((ownPossessionCount / total) * 100) * 10) / 10
    : 50.0;

  return {
    ownPossessionPercentage,
  };
}
