import { Injectable } from '@angular/core';
import { liveCaptureDatabase } from '../data/local-databases';
import { LocalMatchEvent, LiveCaptureEventType } from '../types/live-capture.types';
import { PeriodStatisticDTO } from '../types/statistic.types';
import {
  computeScoreStats,
  computeTackleStats,
  computeTurnoverStats,
  computeDisciplineStats,
  computeSetPieceStats,
  computePossessionStats,
} from './calculators';

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

    return this.computeStatistics(matchId, period, events, eventTypes);
  }

  computeStatistics(
    matchId: string,
    period: number,
    events: LocalMatchEvent[],
    eventTypes: LiveCaptureEventType[]
  ): PeriodStatisticDTO {
    const eventTypeMap = new Map<string, LiveCaptureEventType>();
    for (const et of eventTypes) {
      eventTypeMap.set(et.id, et);
    }

    const periodEvents = events.filter(e => e.period === null || e.period === period);

    return {
      matchId,
      period,
      ...computeScoreStats(periodEvents, eventTypeMap),
      ...computeTackleStats(periodEvents, eventTypeMap),
      ...computeTurnoverStats(periodEvents, eventTypeMap),
      ...computeDisciplineStats(periodEvents, eventTypeMap),
      ...computeSetPieceStats(periodEvents, eventTypeMap),
      ...computePossessionStats(periodEvents),
    };
  }
}
