import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';
import { eventTeam } from './event-rules';

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
    const team = eventTeam(et, event);
    if (!et || !team) continue;

    switch (et.code) {
      case 'TURNOVER_WON':
        team === 'OWN' ? ownTurnoversWon++ : ownTurnoversLost++;
        break;
      case 'HANDLING_ERROR':
      case 'OTHER_TURNOVER':
        team === 'OWN' ? ownTurnoversLost++ : ownTurnoversWon++;
        break;
    }
  }
  return {
    ownTurnoversWon,
    ownTurnoversLost,
  };
}
