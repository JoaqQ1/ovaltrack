import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';

export type TackleStats = Pick<
  PeriodStatisticDTO,
  'ownTacklesCompleted' | 'ownTacklesMissed' | 'ownTackleEffectiveness'
>;

/**
 * Calcula las estadísticas defensivas de tackles y su efectividad porcentual.
 */
export function computeTackleStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): TackleStats {
  let ownTacklesCompleted = 0;
  let ownTacklesMissed = 0;

  for (const event of events) {
    if (event.teamPossession !== 'OWN') continue;

    const et = eventTypeMap.get(event.eventTypeId);
    const typeName = et ? et.name : '';

    if (typeName === 'Tackle completado') {
      ownTacklesCompleted++;
    } else if (typeName === 'Tackle fallado') {
      ownTacklesMissed++;
    }
  }

  const totalTackles = ownTacklesCompleted + ownTacklesMissed;
  const ownTackleEffectiveness = totalTackles > 0
    ? Math.round(((ownTacklesCompleted / totalTackles) * 100) * 10) / 10
    : 0.0;

  return {
    ownTacklesCompleted,
    ownTacklesMissed,
    ownTackleEffectiveness,
  };
}
