import { Injectable } from '@angular/core';
import { liveCaptureDatabase } from '../data/local-databases';
import { LiveCaptureEventType } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
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
    const [events, eventTypes] = await Promise.all([
      inMemoryEvents ?? liveCaptureDatabase.events.where('matchId').equals(matchId).toArray(),
      inMemoryEventTypes && inMemoryEventTypes.length > 0
        ? inMemoryEventTypes
        : liveCaptureDatabase.eventTypes.toArray(),
    ]);

    return this.computeStatistics(matchId, period, events, eventTypes);
  }

  computeStatistics(
    matchId: string,
    period: number,
    events: LocalMatchEvent[],
    eventTypes: LiveCaptureEventType[]
  ): PeriodStatisticDTO {
    const eventTypeMap = new Map(eventTypes.map(et => [et.id, et]));
    const isInPeriod = (e: LocalMatchEvent) => e.period === null || e.period === period;
    const periodEvents = events.filter(isInPeriod);

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
