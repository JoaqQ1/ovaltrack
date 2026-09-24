import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LiveCaptureService } from '../services/live-capture.service';
import { CargaEnVivoComponent } from './carga-en-vivo.component';

declare const describe: (description: string, specDefinitions: () => void) => void;
declare const beforeEach: (action: () => void | Promise<void>) => void;
declare const it: (description: string, testFunction: () => void) => void;
declare const expect: (actual: unknown) => {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
};

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
            }),
            saveLiveCaptureState: () => of(undefined),
            saveEvent: () => of(undefined),
            deleteEvent: () => of(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CargaEnVivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should remove a persisted event from the rendered history', () => {
    const event = {
      id: '550e8400-e29b-41d4-a716-446655440011',
      eventTypeId: 'event-type-try',
      matchId: '550e8400-e29b-41d4-a716-446655440002',
      playerId: null,
      teamPossession: 'OWN' as const,
      matchTime: 10,
      realTime: null,
      period: 1,
      origin: 'live-capture',
      attributes: null,
      createdAt: '2026-09-14T12:00:00Z',
      synchronizedAt: null,
      localSequence: 1,
    };
    component.categories = [{
      name: 'Ataque',
      events: [{
        id: 'event-type-try', name: 'Try', groupName: 'Ataque', category: 'ATTACK',
        affectsPossession: false, isScoring: true, points: 5, requiresPlayer: false,
        active: true, templateEventFields: null, createdAt: '2026-09-14T12:00:00Z',
      }],
    }];
    (component as any).events = [event];

    component.removeHistoryEvent('550e8400-e29b-41d4-a716-446655440011');

    expect(component.history).toEqual([]);
  });

  it('should hide the history by default and toggle its visibility', () => {
    expect(component.historyVisible).toBe(false);

    component.toggleHistory();

    expect(component.historyVisible).toBe(true);
  });

  it('should cancel pending player selection without deleting an event', () => {
    const pendingEvent = {
      id: 'event-type-try', name: 'Try', groupName: 'Ataque', category: 'ATTACK' as const,
      affectsPossession: false, isScoring: true, points: 5, requiresPlayer: true,
      active: true, templateEventFields: null, createdAt: '2026-09-14T12:00:00Z',
    };
    component.pendingSelection = {
      event: pendingEvent,
      eventId: 'pending-event',
      homeEnabled: true,
      awayEnabled: false,
    };
    component.currentPossession = 'OWN';

    component.undoLastEvent();

    expect(component.pendingSelection).toBe(null);
    expect(component.currentPossession).toBe('OWN');
  });

  it('should confirm the pending event without a player when its button is tapped again', () => {
    const pendingEvent = {
      id: 'event-type-try', name: 'Try', groupName: 'Ataque', category: 'ATTACK' as const,
      affectsPossession: false, isScoring: true, points: 5, requiresPlayer: true,
      active: true, templateEventFields: null, createdAt: '2026-09-14T12:00:00Z',
    };
    component.pendingSelection = {
      event: pendingEvent,
      eventId: 'pending-event',
      homeEnabled: true,
      awayEnabled: false,
    };
    component.onEventTap(pendingEvent);

    expect(component.pendingSelection).toBe(null);
    expect((component as any).events[0].id).toBe('pending-event');
    expect((component as any).events[0].attributes).toBe(null);
  });

  it('should revert score without changing possession when deleting an older event', () => {
    const eventType = (id: string, name: string, affectsPossession: boolean, isScoring: boolean, points: number) => ({
      id, name, groupName: 'Test', category: 'ATTACK' as const, affectsPossession, isScoring,
      points, requiresPlayer: false, active: true, templateEventFields: null,
      createdAt: '2026-09-14T12:00:00Z',
    });
    component.categories = [{ name: 'Test', events: [
      eventType('event-type-try', 'Try', true, true, 5),
      eventType('event-type-turnover', 'Turnover', true, false, 0),
    ] }];
    (component as any).events = [
      { id: 'event-1', eventTypeId: 'event-type-try', matchId: 'match', playerId: null, teamPossession: 'OWN', matchTime: 10, realTime: null, period: 1, origin: 'live-capture', attributes: null, createdAt: '2026-09-14T12:00:00Z', synchronizedAt: null, localSequence: 1 },
      { id: 'event-2', eventTypeId: 'event-type-turnover', matchId: 'match', playerId: null, teamPossession: 'OPPONENT', matchTime: 20, realTime: null, period: 1, origin: 'live-capture', attributes: null, createdAt: '2026-09-14T12:00:01Z', synchronizedAt: null, localSequence: 2 },
    ];
    component.currentPossession = 'OWN';
    (component as any).rebuildStateFromEvents();

    component.undoHistoryEvent('event-1');

    expect(component.scoreboard.home).toBe(0);
    expect(component.currentPossession).toBe('OWN');
  });
});