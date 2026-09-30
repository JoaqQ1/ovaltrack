import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';

export type TurnoverStats = Pick<
  PeriodStatisticDTO,
  'ownTurnoversWon' | 'ownTurnoversLost'
>;

/**
 * Calcula los turnovers ganados y perdidos en el período.
 */
export function computeTurnoverStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): TurnoverStats {
  let ownTurnoversWon = 0;
  let ownTurnoversLost = 0;

  for (const event of events) {
    const et = eventTypeMap.get(event.eventTypeId);
    if (et?.name === 'Turnover') {
      if (event.teamPossession === 'OWN') {
        ownTurnoversWon++;
      } else {
        ownTurnoversLost++;
      }
    }
  }

  return {
    ownTurnoversWon,
    ownTurnoversLost,
  };
}
