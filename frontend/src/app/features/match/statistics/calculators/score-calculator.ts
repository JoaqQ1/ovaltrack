import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PeriodStatisticDTO } from '../../statistics/types/statistic.types';
import { countsAsScoring, scoringTeam } from './event-rules';

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

  const result: ScoreStats = {
    ownScore: 0, opponentScore: 0, ownTries: 0, opponentTries: 0,
    ownConversions: 0, opponentConversions: 0, ownPenalties: 0, opponentPenalties: 0,
    ownDropGoals: 0, opponentDropGoals: 0,
  };

  for (const event of events) {
    const et = eventTypeMap.get(event.eventTypeId);
    if (!et || !countsAsScoring(et, event.attributes)) continue;
    const team = scoringTeam(event);
    if (!team) continue;
    const own = team === 'OWN';

    if (own) result.ownScore += et.points; else result.opponentScore += et.points;

    switch (et.code) {
      case 'TRY':
      case 'PENALTY_TRY':
        own ? result.ownTries++ : result.opponentTries++; break;
      case 'CONVERSION':
        own ? result.ownConversions++ : result.opponentConversions++; break;
      case 'PENALTY_KICK':
        own ? result.ownPenalties++ : result.opponentPenalties++; break;
      case 'DROP_GOAL':
        own ? result.ownDropGoals++ : result.opponentDropGoals++; break;
    }
  }
  return result
}
