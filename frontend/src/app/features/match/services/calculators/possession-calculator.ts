import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';
import { calculatePercentage } from './math-utils';

export type PossessionStats = Pick<PeriodStatisticDTO, 'ownPossessionPercentage'>;

/**
 * Calcula el porcentaje de posesión neta para el equipo propio.
 */
export function computePossessionStatsByEvents(
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


export function computePossessionStatsByTime(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): PossessionStats {
  const counted = events.filter(e => {
    const et = eventTypeMap.get(e.eventTypeId);
    return et && et.actor !== 'CHOOSE' && e.teamPossession !== 'NEUTRAL' && e.matchTime != null;
  });

  const sorted = [...counted].sort((a, b) => (a.matchTime ?? 0) - (b.matchTime ?? 0));

  let ownTime = 0;
  let oppTime = 0;
  let lastTime = 0;

  for (const e of sorted) {
    const currentTime = e.matchTime ?? 0;
    const duration = currentTime - lastTime;

    if (duration > 0) {
      if (e.teamPossession === 'OWN') {
        ownTime += duration;
      } else if (e.teamPossession === 'OPPONENT') {
        oppTime += duration;
      }
    }
    lastTime = currentTime;
  } 

  const totalTime = ownTime + oppTime;
  return { 
    ownPossessionPercentage: calculatePercentage(ownTime, totalTime, 50.0) 
  };
}