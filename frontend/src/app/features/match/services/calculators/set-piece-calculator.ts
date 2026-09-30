import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
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
  let scrumsTotal = 0;
  let lineoutsTotal = 0;

  for (const event of events) {
    const et = eventTypeMap.get(event.eventTypeId);
    const typeName = et ? et.name : '';

    if (typeName === 'Scrum') {
      scrumsTotal++;
    } else if (typeName === 'Line-out' || typeName === 'Line') {
      lineoutsTotal++;
    }
  }

  return {
    scrumsTotal,
    lineoutsTotal,
  };
}
