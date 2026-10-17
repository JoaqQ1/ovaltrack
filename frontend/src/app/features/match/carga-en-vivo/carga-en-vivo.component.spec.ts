import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LiveCaptureService } from '../services/live-capture.service';
import { MatchService } from '../services/match.service';
import { StatisticCalculationService } from '../services/statistic-calculation.service';
import { LiveCaptureEventType } from '../types/event-type.types';
import { CargaEnVivoComponent } from './carga-en-vivo.component';

declare const describe: (description: string, specDefinitions: () => void) => void;
declare const beforeEach: (action: () => void | Promise<void>) => void;
declare const it: (description: string, testFunction: () => void | Promise<void>) => void;
declare const expect: (actual: unknown) => {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  not: {
    toBe(expected: unknown): void;
  };
};

const eventType = (overrides: Partial<LiveCaptureEventType> = {}): LiveCaptureEventType => ({
  id: 'event-type-try', name: 'Try', groupName: 'Ataque', category: 'ATTACK',
  isScoring: true, points: 5, requiresPlayer: true, isActive: true,
  code: 'TRY', showInPalette: true, followUpEventTypeId: null,
  actor: 'ATTACKING', possessionAfter: 'KEEP', followUpChoices: [], templateEventFields: [],
  createdAt: '2026-09-14T12:00:00Z',
  ...overrides,
});

const storedEvent = (id: string, eventTypeId: string, teamPossession: 'OWN' | 'OPPONENT' | 'NEUTRAL', sequence: number) => ({
  id, eventTypeId, matchId: 'match', playerId: null, teamPossession, matchTime: sequence * 10, realTime: null,
  period: 1, origin: 'live-capture', attributes: null, createdAt: '2026-09-14T12:00:00Z',
  synchronizedAt: null, localSequence: sequence,
});

describe('CargaEnVivoComponent', () => {
  let fixture: ComponentFixture<CargaEnVivoComponent>;
  let component: CargaEnVivoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaEnVivoComponent],
      providers: [
        {
          provide: LiveCaptureService,
          useValue: {
            getLiveCaptureBootstrap: () => of({
              match: {
                id: '550e8400-e29b-41d4-a716-446655440002',
                date: '2026-09-14T12:00:00',
                divisionId: '550e8400-e29b-41d4-a716-446655440001',
                opponent: 'DRC',
                status: 'not_started' as const,
                currentPeriod: 1,
                clockElapsedSeconds: 0,
                clockPaused: true,
                currentPossession: 'OWN' as const,
                homeScore: 0,
                awayScore: 0,
              },
              query: {
                clubId: '550e8400-e29b-41d4-a716-446655440000',
                divisionId: '550e8400-e29b-41d4-a716-446655440001',
                matchId: '550e8400-e29b-41d4-a716-446655440002',
              },
              state: {
                homeTeam: 'PMRC',
                awayTeam: 'DRC',
                scoreboard: { home: 0, away: 0 },
                gameClock: '00:00',
                periodLabel: '1T',
                clockPaused: false,
                currentPossession: 'OWN',
                synchronized: false,
                history: [],
              },
              recentEvents: [],
              eventTypes: [],
              rosterPlayers: [],
            }),
            saveLiveCaptureState: () => of(undefined),
            saveEvent: (event: unknown) => of(event),
            syncPendingEvents: () => of([]),
            deleteEvent: () => of(undefined),
          },
        },
        {
          provide: MatchService,
          useValue: {
            closeFirstHalf: () => of(undefined),
            startSecondHalf: () => of(undefined),
            getPeriodStatistics: () => of({}),
          },
        },
        {
          provide: StatisticCalculationService,
          useValue: {
            calculatePeriodStatistics: () => Promise.resolve({
              matchId: '550e8400-e29b-41d4-a716-446655440002',
              period: 1,
              ownScore: 10,
              opponentScore: 5,
              ownTries: 2,
              opponentTries: 1,
              ownConversions: 0,
              opponentConversions: 0,
              ownPenalties: 0,
              opponentPenalties: 0,
              ownDropGoals: 0,
              opponentDropGoals: 0,
              ownTacklesCompleted: 15,
              ownTacklesMissed: 2,
              ownTackleEffectiveness: 88.2,
              ownTurnoversWon: 3,
              ownTurnoversLost: 1,
              ownPenaltiesConceded: 4,
              opponentPenaltiesConceded: 6,
              ownYellowCards: 0,
              opponentYellowCards: 0,
              ownRedCards: 0,
              opponentRedCards: 0,
              scrumsTotal: 4,
              lineoutsTotal: 6,
              ownPossessionPercentage: 55.0,
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CargaEnVivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should remove a persisted event from the rendered history', () => {
    component.eventTypes = [eventType({ requiresPlayer: false })];
    (component as any).events = [storedEvent('550e8400-e29b-41d4-a716-446655440011', 'event-type-try', 'OWN', 1)];

    component.removeHistoryEvent('550e8400-e29b-41d4-a716-446655440011');

    expect(component.history).toEqual([]);
  });

  it('should hide the history by default and toggle its visibility', () => {
    expect(component.historyVisible).toBe(false);

    component.toggleHistory();

    expect(component.historyVisible).toBe(true);
  });

  it('should open the capture modal with a player step and cancel it without deleting an event', () => {
    component.isStarted = true;
    component.currentPossession = 'OWN';

    component.onEventTap(eventType());

    expect(component.capture).not.toBe(null);
    expect(component.captureStep?.kind).toBe('player');

    component.undoLastEvent();

    expect(component.capture).toBe(null);
    expect(component.currentPossession).toBe('OWN');
  });

  it('should save the event without a player when "Sin jugador" is picked', () => {
    component.eventTypes = [eventType()];
    component.isStarted = true;
    component.currentPossession = 'OWN';

    component.onEventTap(eventType());
    component.pickPlayer(null);

    expect(component.capture).toBe(null);
    expect((component as any).events[0].eventTypeId).toBe('event-type-try');
    expect((component as any).events[0].attributes).toBe(null);
  });

  it('should assign a defensive event to the team without the ball', () => {
    component.eventTypes = [eventType({ id: 'tackle', name: 'Tackle completado', code: 'TACKLE_MADE', isScoring: false, points: 0, actor: 'DEFENDING' })];
    component.isStarted = true;
    component.currentPossession = 'OPPONENT';

    component.onEventTap(component.eventTypes[0]);

    expect(component.capture?.team).toBe('OWN');
    expect(component.capture?.canChooseTeam).toBe(false);
  });

  it('should let the analyst choose the team when the actor is CHOOSE', () => {
    component.isStarted = true;
    component.currentPossession = 'OWN';

    component.onEventTap(eventType({ id: 'card', name: 'Amonestación', code: 'YELLOW_CARD', isScoring: false, points: 0, actor: 'CHOOSE' }));

    expect(component.capture?.canChooseTeam).toBe(true);
  });

  it('should ask for the team first on events without a player when possession is neutral', () => {
    component.isStarted = true;
    component.currentPossession = 'NEUTRAL';

    component.onEventTap(eventType({ id: 'ruck', name: 'Ruck ofensivo', code: 'RUCK_OFFENSIVE', isScoring: false, points: 0, requiresPlayer: false }));

    expect(component.captureStep?.kind).toBe('team');
  });

  it('should skip preset steps and resolve the follow-up team with the updated possession', () => {
    const touch = eventType({
      id: 'touch', name: 'Patada a touch', code: 'KICK_TO_TOUCH', isScoring: false, points: 0,
      templateEventFields: [{
        key: 'kind', label: 'Tipo', type: 'select', phase: 'live', required: true,
        options: [{ value: 'penalty_touch', label: 'Penal a touch' }, { value: 'open_play', label: 'Juego abierto' }],
      }],
    });
    component.eventTypes = [touch];
    component.currentPossession = 'OPPONENT';

    component.pickFollowUp({ type: touch, label: touch.name, preset: { kind: 'penalty_touch' } });

    expect(component.capture?.steps.map(step => step.kind)).toEqual(['player']);
    expect(component.capture?.values).toEqual({ kind: 'penalty_touch' });
    expect(component.capture?.team).toBe('OPPONENT');
  });

  it('should revert score without changing possession when deleting an older event', () => {
    component.eventTypes = [
      eventType({ id: 'event-type-try', requiresPlayer: false, possessionAfter: 'OTHER' }),
      eventType({ id: 'event-type-turnover', name: 'Turnover ganado', code: 'TURNOVER_WON', isScoring: false, points: 0,
        requiresPlayer: false, actor: 'DEFENDING', possessionAfter: 'ACTOR' }),
    ];
    (component as any).events = [
      storedEvent('event-1', 'event-type-try', 'OWN', 1),
      storedEvent('event-2', 'event-type-turnover', 'OPPONENT', 2),
    ];
    component.currentPossession = 'OWN';
    (component as any).rebuildStateFromEvents();

    component.undoHistoryEvent('event-1');

    expect(component.scoreboard.home).toBe(0);
    // El robo lo hizo OPPONENT y la pelota queda en él; borrar un evento viejo no la mueve.
    expect(component.currentPossession).toBe('OPPONENT');
  });

  it('should derive possession from the actor and the possession rule of the last event', () => {
    component.eventTypes = [
      eventType({ id: 'error', name: 'Error de manejo', code: 'HANDLING_ERROR', isScoring: false, points: 0, requiresPlayer: false, possessionAfter: 'OTHER' }),
      eventType({ id: 'lineout', name: 'Line-out', code: 'LINEOUT', isScoring: false, points: 0, requiresPlayer: false, possessionAfter: 'KEEP' }),
    ];
    (component as any).events = [
      storedEvent('event-1', 'error', 'OWN', 1),
      storedEvent('event-2', 'lineout', 'OPPONENT', 2),
    ];
    component.currentPossession = 'OWN';

    (component as any).rebuildStateFromEvents();

    expect(component.currentPossession).toBe('OPPONENT');
  });

  it('should apply the possession of the chosen option', () => {
    component.eventTypes = [eventType({
      id: 'scrum', name: 'Scrum', code: 'SCRUM', isScoring: false, points: 0, requiresPlayer: false,
      templateEventFields: [{
        key: 'scrumResult', label: 'Resultado', type: 'select', phase: 'live', required: true,
        options: [
          { value: 'won_clean', label: 'Ganó', possession: 'KEEP' },
          { value: 'lost_own', label: 'Perdió', possession: 'OTHER' },
        ],
      }],
    })];
    (component as any).events = [{ ...storedEvent('event-1', 'scrum', 'OWN', 1), attributes: { scrumResult: 'lost_own' } }];
    component.currentPossession = 'OWN';

    (component as any).rebuildStateFromEvents();

    expect(component.currentPossession).toBe('OPPONENT');
  });

  it('should open confirm halftime dialog when period button is clicked in period 1', () => {
    component.period = 1;
    component.isHalftime = false;
    component.showConfirmHalftime = false;

    component.onPeriodButtonClick();

    expect(component.showConfirmHalftime).toBe(true);
  });

  it('should close first half and pause clock on confirm', async () => {
    component.period = 1;
    component.clockPaused = false;
    component.gameClock = '40:15';

    await component.confirmCloseFirstHalf();

    expect(component.isHalftime).toBe(true);
    expect(component.periodLabel).toBe('Entretiempo');
    expect(component.clockPaused).toBe(true);
  });
});