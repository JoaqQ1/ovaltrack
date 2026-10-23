import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../statistics/types/statistic.types';
import { eventTeam } from './event-rules';

export type DisciplineStats = Pick<
  PeriodStatisticDTO,
  | 'ownPenaltiesConceded'
  | 'opponentPenaltiesConceded'
  | 'ownYellowCards'
  | 'opponentYellowCards'
  | 'ownRedCards'
  | 'opponentRedCards'
>;

/**
 * Calcula las estadísticas disciplinarias (infracciones, amarillas y rojas).
 */
export function computeDisciplineStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): DisciplineStats {
  let ownPenaltiesConceded = 0;
  let opponentPenaltiesConceded = 0;
  let ownYellowCards = 0;
  let opponentYellowCards = 0;
  let ownRedCards = 0;
  let opponentRedCards = 0;

  for (const event of events) {
    const et = eventTypeMap.get(event.eventTypeId);
    const team = eventTeam(et, event);
    if (!et || !team) continue;
    const own = team === 'OWN';

    switch (et.code) {
      case 'PENALTY_CONCEDED':
        own ? ownPenaltiesConceded++ : opponentPenaltiesConceded++;
        break;
      case 'YELLOW_CARD':
        own ? ownYellowCards++ : opponentYellowCards++;
        break;
      case 'RED_CARD':
        own ? ownRedCards++ : opponentRedCards++;
        break;
      case 'SCRUM':
      case 'LINEOUT': {
        // penalty_for / penalty_against are recorded as the result, with no separate PENALTY_CONCEDED
        const result = event.attributes?.[et.code === 'SCRUM' ? 'scrumResult' : 'lineResult'];
        if (result === 'penalty_against') own ? ownPenaltiesConceded++ : opponentPenaltiesConceded++;
        if (result === 'penalty_for')     own ? opponentPenaltiesConceded++ : ownPenaltiesConceded++;
        break;
      }
    }
  }




  return {
    ownPenaltiesConceded,
    opponentPenaltiesConceded,
    ownYellowCards,
    opponentYellowCards,
    ownRedCards,
    opponentRedCards,
  };
}
