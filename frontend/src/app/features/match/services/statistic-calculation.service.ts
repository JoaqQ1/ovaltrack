import { Injectable } from '@angular/core';
import { liveCaptureDatabase } from '../data/local-databases';
import { LiveCaptureEventType } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
import { PeriodStatisticDTO, PlayerPeriodStatistic } from '../types/statistic.types';
import {
  computeScoreStats,
  computeTackleStats,
  computeTurnoverStats,
  computeDisciplineStats,
  computeSetPieceStats,
  computePossessionStats,
  computePlayerPeriodStats,
  RosterPlayerInfo,
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

    return this.computeStatistics(matchId, period, events.filter(event => event.active), eventTypes);
  }

  async calculateMatchStatistics(
    matchId: string,
    inMemoryEvents?: LocalMatchEvent[],
    inMemoryEventTypes?: LiveCaptureEventType[]
  ): Promise<PeriodStatisticDTO> {
    const [events, eventTypes] = await Promise.all([
      inMemoryEvents ?? liveCaptureDatabase.events.where('matchId').equals(matchId).toArray(),
      inMemoryEventTypes && inMemoryEventTypes.length > 0
        ? inMemoryEventTypes
        : liveCaptureDatabase.eventTypes.toArray(),
    ]);

    return this.computeStatistics(matchId, 0, events.filter(event => event.active), eventTypes, false);
  }

  computeStatistics(
    matchId: string,
    period: number,
    events: LocalMatchEvent[],
    eventTypes: LiveCaptureEventType[],
    filterByPeriod = true
  ): PeriodStatisticDTO {
    const eventTypeMap = new Map(eventTypes.map(et => [et.id, et]));
    const isInPeriod = (e: LocalMatchEvent) => e.period === null || e.period === period;
    const periodEvents = filterByPeriod ? events.filter(isInPeriod) : events;

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

  async calculatePlayerStatistics(
    matchId: string,
    roster: RosterPlayerInfo[],
    period: number = 1,
    inMemoryEvents?: LocalMatchEvent[],
    inMemoryEventTypes?: LiveCaptureEventType[]
  ): Promise<PlayerPeriodStatistic[]> {
    const [events, eventTypes] = await Promise.all([
      inMemoryEvents ?? liveCaptureDatabase.events.where('matchId').equals(matchId).toArray(),
      inMemoryEventTypes && inMemoryEventTypes.length > 0
        ? inMemoryEventTypes
        : liveCaptureDatabase.eventTypes.toArray(),
    ]);

    return this.computePlayerStatistics(roster, period, events.filter(event => event.active), eventTypes);
  }

  computePlayerStatistics(
    roster: RosterPlayerInfo[],
    period: number,
    events: LocalMatchEvent[],
    eventTypes: LiveCaptureEventType[]
  ): PlayerPeriodStatistic[] {
    const eventTypeMap = new Map(eventTypes.map(et => [et.id, et]));
    const isInPeriod = (e: LocalMatchEvent) => e.period === null || e.period === period;
    const periodEvents = events.filter(isInPeriod);

    return computePlayerPeriodStats(periodEvents, roster, eventTypeMap);
  }
}

