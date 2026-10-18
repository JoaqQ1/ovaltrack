import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';

export type SetPieceStats = Pick<
  PeriodStatisticDTO,
  'scrumsTotal' | 'lineoutsTotal'
>;

/**
 * Calcula el total de formaciones fijas (Scrums y Line-outs) del período.
 */
export function computeSetPieceStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): SetPieceStats {
  const countByCode = (code: string) =>
    events.filter(e => eventTypeMap.get(e.eventTypeId)?.code === code).length;
  return { scrumsTotal: countByCode('SCRUM'), lineoutsTotal: countByCode('LINEOUT') };

}
