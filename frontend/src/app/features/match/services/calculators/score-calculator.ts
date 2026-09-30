import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
import { PeriodStatisticDTO } from '../../types/statistic.types';

export type ScoreStats = Pick<
  PeriodStatisticDTO,
  | 'ownScore'
  | 'opponentScore'
  | 'ownTries'
  | 'opponentTries'
  | 'ownConversions'
  | 'opponentConversions'
  | 'ownPenalties'
  | 'opponentPenalties'
  | 'ownDropGoals'
  | 'opponentDropGoals'
>;

/**
 * Calcula las estadísticas relacionadas al tanteador y puntos anotados en un período.
 */
export function computeScoreStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): ScoreStats {
  let ownScore = 0;
  let opponentScore = 0;
  let ownTries = 0;
  let opponentTries = 0;
  let ownConversions = 0;
  let opponentConversions = 0;
  let ownPenalties = 0;
  let opponentPenalties = 0;
  let ownDropGoals = 0;
  let opponentDropGoals = 0;

  for (const event of events) {
    const et = eventTypeMap.get(event.eventTypeId);
    const typeName = et ? et.name : '';
    const possession = event.teamPossession;

    switch (typeName) {
      case 'Try':
        if (possession === 'OWN') {
          ownTries++;
          ownScore += 5;
        } else {
          opponentTries++;
          opponentScore += 5;
        }
        break;
      case 'Conversión':
      case 'Conversion':
        if (possession === 'OWN') {
          ownConversions++;
          ownScore += 2;
        } else {
          opponentConversions++;
          opponentScore += 2;
        }
        break;
      case 'Penal a los palos':
        if (possession === 'OWN') {
          ownPenalties++;
          ownScore += 3;
        } else {
          opponentPenalties++;
          opponentScore += 3;
        }
        break;
      case 'Drop gol':
        if (possession === 'OWN') {
          ownDropGoals++;
          ownScore += 3;
        } else {
          opponentDropGoals++;
          opponentScore += 3;
        }
        break;
    }
  }

  return {
    ownScore,
    opponentScore,
    ownTries,
    opponentTries,
    ownConversions,
    opponentConversions,
    ownPenalties,
    opponentPenalties,
    ownDropGoals,
    opponentDropGoals,
  };
}
