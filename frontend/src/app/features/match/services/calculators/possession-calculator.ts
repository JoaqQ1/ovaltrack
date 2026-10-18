import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';
import { calculatePercentage } from './math-utils';

export type PossessionStats = Pick<PeriodStatisticDTO, 'ownPossessionPercentage'>;

/**
 * Calcula el porcentaje de posesión neta para el equipo propio.
 */
export function computePossessionStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): PossessionStats {
  const counted = events.filter(e => {
    const et = eventTypeMap.get(e.eventTypeId);
    return et && et.actor !== 'CHOOSE' && e.teamPossession !== 'NEUTRAL';
  });
  const own = counted.filter(e => e.teamPossession === 'OWN').length;
  return { ownPossessionPercentage: calculatePercentage(own, counted.length, 50.0) };
}