import { Injectable } from '@angular/core';
import { liveCaptureDatabase } from '../data/local-databases';
import { LocalMatchEvent, LiveCaptureEventType } from '../types/live-capture.types';
import { PeriodStatisticDTO } from '../types/statistic.types';

@Injectable({ providedIn: 'root' })
export class StatisticCalculationService {

  async calculatePeriodStatistics(
    matchId: string,
    period: number = 1,
    inMemoryEvents?: LocalMatchEvent[],
    inMemoryEventTypes?: LiveCaptureEventType[]
  ): Promise<PeriodStatisticDTO> {
    const events = inMemoryEvents ?? await liveCaptureDatabase.events.where('matchId').equals(matchId).toArray();
    const eventTypes = inMemoryEventTypes && inMemoryEventTypes.length > 0
      ? inMemoryEventTypes
      : await liveCaptureDatabase.eventTypes.toArray();

    const eventTypeMap = new Map<string, LiveCaptureEventType>();
    for (const et of eventTypes) {
      eventTypeMap.set(et.id, et);
    }

    const periodEvents = events.filter(e => (e.period === null || e.period === period));

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
    let ownTacklesCompleted = 0;
    let ownTacklesMissed = 0;
    let ownTurnoversWon = 0;
    let ownTurnoversLost = 0;
    let ownPenaltiesConceded = 0;
    let opponentPenaltiesConceded = 0;
    let ownYellowCards = 0;
    let opponentYellowCards = 0;
    let ownRedCards = 0;
    let opponentRedCards = 0;
    let scrumsTotal = 0;
    let lineoutsTotal = 0;

    let ownPossessionCount = 0;
    let opponentPossessionCount = 0;

    for (const event of periodEvents) {
      const et = eventTypeMap.get(event.eventTypeId);
      const typeName = et ? et.name : '';
      const possession = event.teamPossession;

      if (possession === 'OWN') {
        ownPossessionCount++;
      } else if (possession === 'OPPONENT') {
        opponentPossessionCount++;
      }

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
        case 'Tackle completado':
          if (possession === 'OWN') {
            ownTacklesCompleted++;
          }
          break;
        case 'Tackle fallado':
          if (possession === 'OWN') {
            ownTacklesMissed++;
          }
          break;
        case 'Turnover':
          if (possession === 'OWN') {
            ownTurnoversWon++;
          } else {
            ownTurnoversLost++;
          }
          break;
        case 'Penal / infracción':
          if (possession === 'OWN') {
            ownPenaltiesConceded++;
          } else {
            opponentPenaltiesConceded++;
          }
          break;
        case 'Amonestación':
          if (possession === 'OWN') {
            ownYellowCards++;
          } else {
            opponentYellowCards++;
          }
          break;
        case 'Expulsión':
          if (possession === 'OWN') {
            ownRedCards++;
          } else {
            opponentRedCards++;
          }
          break;
        case 'Scrum':
          scrumsTotal++;
          break;
        case 'Line-out':
          lineoutsTotal++;
          break;
      }
    }

    const totalTackles = ownTacklesCompleted + ownTacklesMissed;
    const ownTackleEffectiveness = totalTackles > 0
      ? Math.round(((ownTacklesCompleted / totalTackles) * 100) * 10) / 10
      : 0.0;

    const totalPossessionEvents = ownPossessionCount + opponentPossessionCount;
    const ownPossessionPercentage = totalPossessionEvents > 0
      ? Math.round(((ownPossessionCount / totalPossessionEvents) * 100) * 10) / 10
      : 50.0;

    return {
      matchId,
      period,
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
      ownTacklesCompleted,
      ownTacklesMissed,
      ownTackleEffectiveness,
      ownTurnoversWon,
      ownTurnoversLost,
      ownPenaltiesConceded,
      opponentPenaltiesConceded,
      ownYellowCards,
      opponentYellowCards,
      ownRedCards,
      opponentRedCards,
      scrumsTotal,
      lineoutsTotal,
      ownPossessionPercentage
    };
  }
}
