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
  const getName = (e: LocalMatchEvent) => eventTypeMap.get(e.eventTypeId)?.name ?? '';

  return {
    scrumsTotal: events.filter(e => getName(e) === 'Scrum').length,
    lineoutsTotal: events.filter(e => {
      const name = getName(e);
      return name === 'Line-out' || name === 'Line';
    }).length,
  };
}
