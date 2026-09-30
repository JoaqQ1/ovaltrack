import { TestBed } from '@angular/core/testing';
import { StatisticCalculationService } from './statistic-calculation.service';
import { LocalMatchEvent, LiveCaptureEventType } from '../types/live-capture.types';
import {
  computeScoreStats,
  computeTackleStats,
  computeTurnoverStats,
  computeDisciplineStats,
  computeSetPieceStats,
  computePossessionStats,
} from './calculators';

describe('StatisticCalculationService & Domain Calculators', () => {
  let service: StatisticCalculationService;

  const mockEventTypes: LiveCaptureEventType[] = [
    { id: '1', name: 'Try', description: 'Try scored' },
    { id: '2', name: 'Conversión', description: 'Conversion kick' },
    { id: '3', name: 'Penal a los palos', description: 'Penalty kick' },
    { id: '4', name: 'Drop gol', description: 'Drop goal' },
    { id: '5', name: 'Tackle completado', description: 'Completed tackle' },
    { id: '6', name: 'Tackle fallado', description: 'Missed tackle' },
    { id: '7', name: 'Turnover', description: 'Turnover' },
    { id: '8', name: 'Penal / infracción', description: 'Penalty conceded' },
    { id: '9', name: 'Amonestación', description: 'Yellow card' },
    { id: '10', name: 'Expulsión', description: 'Red card' },
    { id: '11', name: 'Scrum', description: 'Scrum' },
    { id: '12', name: 'Line-out', description: 'Line-out' },
  ];

  const eventTypeMap = new Map<string, LiveCaptureEventType>(
    mockEventTypes.map(et => [et.id, et])
  );

  const createEvent = (
    eventTypeId: string,
    teamPossession: 'OWN' | 'OPPONENT',
    period: number | null = 1
  ): LocalMatchEvent => ({
    id: `ev-${Math.random()}`,
    matchId: 'match-1',
    eventTypeId,
    timestamp: new Date().toISOString(),
    matchTimeMinute: 10,
    matchTimeSecond: 0,
    period,
    teamPossession,
    syncStatus: 'SYNCED',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StatisticCalculationService],
    });
    service = TestBed.inject(StatisticCalculationService);
  });

  describe('Pure Calculators', () => {
    describe('computeScoreStats', () => {
      it('calculates points and counts for OWN and OPPONENT correctly', () => {
        const events: LocalMatchEvent[] = [
          createEvent('1', 'OWN'),      // Try (5)
          createEvent('2', 'OWN'),      // Conversion (2)
          createEvent('3', 'OWN'),      // Penalty (3)
          createEvent('4', 'OWN'),      // Drop (3)
          createEvent('1', 'OPPONENT'), // Try (5)
          createEvent('3', 'OPPONENT'), // Penalty (3)
        ];

        const stats = computeScoreStats(events, eventTypeMap);

        expect(stats.ownScore).toBe(13); // 5 + 2 + 3 + 3
        expect(stats.ownTries).toBe(1);
        expect(stats.ownConversions).toBe(1);
        expect(stats.ownPenalties).toBe(1);
        expect(stats.ownDropGoals).toBe(1);

        expect(stats.opponentScore).toBe(8); // 5 + 3
        expect(stats.opponentTries).toBe(1);
        expect(stats.opponentConversions).toBe(0);
        expect(stats.opponentPenalties).toBe(1);
        expect(stats.opponentDropGoals).toBe(0);
      });

      it('returns zeroes when no scoring events exist', () => {
        const stats = computeScoreStats([], eventTypeMap);
        expect(stats.ownScore).toBe(0);
        expect(stats.opponentScore).toBe(0);
        expect(stats.ownTries).toBe(0);
      });
    });

    describe('computeTackleStats', () => {
      it('calculates completed tackles, missed tackles and effectiveness percentage', () => {
        const events: LocalMatchEvent[] = [
          createEvent('5', 'OWN'), // Completed
          createEvent('5', 'OWN'), // Completed
          createEvent('5', 'OWN'), // Completed
          createEvent('6', 'OWN'), // Missed
        ];

        const stats = computeTackleStats(events, eventTypeMap);

        expect(stats.ownTacklesCompleted).toBe(3);
        expect(stats.ownTacklesMissed).toBe(1);
        expect(stats.ownTackleEffectiveness).toBe(75.0);
      });

      it('returns 0.0% effectiveness when no tackles are recorded', () => {
        const stats = computeTackleStats([], eventTypeMap);
        expect(stats.ownTacklesCompleted).toBe(0);
        expect(stats.ownTacklesMissed).toBe(0);
        expect(stats.ownTackleEffectiveness).toBe(0.0);
      });

      it('ignores opponent possession events for own tackle stats', () => {
        const events: LocalMatchEvent[] = [
          createEvent('5', 'OPPONENT'),
        ];
        const stats = computeTackleStats(events, eventTypeMap);
        expect(stats.ownTacklesCompleted).toBe(0);
      });
    });

    describe('computeTurnoverStats', () => {
      it('calculates turnovers won and lost', () => {
        const events: LocalMatchEvent[] = [
          createEvent('7', 'OWN'),      // Turnover won
          createEvent('7', 'OWN'),      // Turnover won
          createEvent('7', 'OPPONENT'), // Turnover lost
        ];

        const stats = computeTurnoverStats(events, eventTypeMap);

        expect(stats.ownTurnoversWon).toBe(2);
        expect(stats.ownTurnoversLost).toBe(1);
      });
    });

    describe('computeDisciplineStats', () => {
      it('calculates penalties conceded, yellow cards and red cards', () => {
        const events: LocalMatchEvent[] = [
          createEvent('8', 'OWN'),      // Penalty conceded (own)
          createEvent('9', 'OWN'),      // Yellow card (own)
          createEvent('8', 'OPPONENT'), // Penalty conceded (opponent)
          createEvent('8', 'OPPONENT'), // Penalty conceded (opponent)
          createEvent('10', 'OPPONENT'),// Red card (opponent)
        ];

        const stats = computeDisciplineStats(events, eventTypeMap);

        expect(stats.ownPenaltiesConceded).toBe(1);
        expect(stats.ownYellowCards).toBe(1);
        expect(stats.ownRedCards).toBe(0);

        expect(stats.opponentPenaltiesConceded).toBe(2);
        expect(stats.opponentYellowCards).toBe(0);
        expect(stats.opponentRedCards).toBe(1);
      });
    });

    describe('computeSetPieceStats', () => {
      it('calculates scrums and line-outs', () => {
        const events: LocalMatchEvent[] = [
          createEvent('11', 'OWN'),
          createEvent('11', 'OPPONENT'),
          createEvent('12', 'OWN'),
        ];

        const stats = computeSetPieceStats(events, eventTypeMap);

        expect(stats.scrumsTotal).toBe(2);
        expect(stats.lineoutsTotal).toBe(1);
      });
    });

    describe('computePossessionStats', () => {
      it('calculates possession percentage based on event possession', () => {
        const events: LocalMatchEvent[] = [
          createEvent('1', 'OWN'),
          createEvent('2', 'OWN'),
          createEvent('3', 'OWN'),
          createEvent('1', 'OPPONENT'),
        ];

        const stats = computePossessionStats(events);

        expect(stats.ownPossessionPercentage).toBe(75.0);
      });

      it('defaults to 50.0% when no possession events exist', () => {
        const stats = computePossessionStats([]);
        expect(stats.ownPossessionPercentage).toBe(50.0);
      });
    });
  });

  describe('StatisticCalculationService.computeStatistics', () => {
    it('integrates all modular calculators and filters by the requested period', () => {
      const events: LocalMatchEvent[] = [
        createEvent('1', 'OWN', 1),      // Period 1 Try (+5)
        createEvent('2', 'OWN', 1),      // Period 1 Conversion (+2)
        createEvent('5', 'OWN', 1),      // Period 1 Completed tackle
        createEvent('1', 'OPPONENT', 2), // Period 2 Try (should be filtered out)
        createEvent('11', 'OWN', null),  // Global / null period event (included in period 1)
      ];

      const result = service.computeStatistics('match-123', 1, events, mockEventTypes);

      expect(result.matchId).toBe('match-123');
      expect(result.period).toBe(1);
      expect(result.ownScore).toBe(7);
      expect(result.opponentScore).toBe(0);
      expect(result.ownTacklesCompleted).toBe(1);
      expect(result.scrumsTotal).toBe(1);
    });

    it('calculates period statistics using calculatePeriodStatistics with inMemory parameters', async () => {
      const events: LocalMatchEvent[] = [
        createEvent('1', 'OWN', 1),
      ];

      const result = await service.calculatePeriodStatistics('match-456', 1, events, mockEventTypes);

      expect(result.matchId).toBe('match-456');
      expect(result.ownScore).toBe(5);
      expect(result.ownTries).toBe(1);
    });
  });
});
