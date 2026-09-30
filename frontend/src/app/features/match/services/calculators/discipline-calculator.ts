import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';

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
    const typeName = et ? et.name : '';
    const isOwn = event.teamPossession === 'OWN';

    switch (typeName) {
      case 'Penal / infracción':
        if (isOwn) {
          ownPenaltiesConceded++;
        } else {
          opponentPenaltiesConceded++;
        }
        break;
      case 'Amonestación':
        if (isOwn) {
          ownYellowCards++;
        } else {
          opponentYellowCards++;
        }
        break;
      case 'Expulsión':
        if (isOwn) {
          ownRedCards++;
        } else {
          opponentRedCards++;
        }
        break;
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
