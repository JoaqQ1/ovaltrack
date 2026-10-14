import { TestBed } from '@angular/core/testing';
import { MatchReviewStore } from './match-review.store';
import { MatchTimelineEventResponse } from '../../types/event.types';

describe('MatchReviewStore (HU-8.4)', () => {
  let store: MatchReviewStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MatchReviewStore]
    });
    store = TestBed.inject(MatchReviewStore);
  });

  it('should initialize with empty state', () => {
    expect(store.rawEvents()).toEqual([]);
    expect(store.visibleEvents()).toEqual([]);
    expect(store.selectedEventId()).toBeNull();
  });

  it('should add event, sort chronologically and select it', () => {
    const event1: MatchTimelineEventResponse = {
      id: 'ev-1',
      eventTypeId: 'type-1',
      eventTypeName: 'Tackle completado',
      matchTime: 600,
      absoluteMatchTime: 650,
      period: 1,
      teamPossession: 'OWN',
      origin: 'live-capture'
    };

    const event2: MatchTimelineEventResponse = {
      id: 'ev-2',
      eventTypeId: 'type-2',
      eventTypeName: 'Try',
      matchTime: 300,
      absoluteMatchTime: 320,
      period: 1,
      teamPossession: 'OWN',
      origin: 'post_capture'
    };

    store.setEvents([event1]);
    expect(store.rawEvents().length).toBe(1);

    store.addEvent(event2);

    const raw = store.rawEvents();
    expect(raw.length).toBe(2);
    // event2 (300s) should be sorted before event1 (600s)
    expect(raw[0].id).toBe('ev-2');
    expect(raw[1].id).toBe('ev-1');
    expect(store.selectedEventId()).toBe('ev-2');

    const vms = store.allViewModels();
    expect(vms[0].isPostMatch).toBeTrue();
    expect(vms[0].origin).toBe('post_capture');
    expect(vms[0].absoluteMatchTime).toBe(320);
    expect(vms[0].absoluteTimeFormatted).toBe('05:20');
    expect(vms[1].isPostMatch).toBeFalse();
    expect(vms[1].origin).toBe('live-capture');
    expect(vms[1].absoluteMatchTime).toBe(650);
    expect(vms[1].absoluteTimeFormatted).toBe('10:50');
  });

  it('should enrich player name and jersey number when available in roster', () => {
    store.setAvailablePlayers([
      { id: 'player-1', fullName: 'Juan Pérez', jerseyNumber: 10, position: null }
    ]);

    const newEvent: MatchTimelineEventResponse = {
      id: 'ev-3',
      eventTypeId: 'type-1',
      eventTypeName: 'Try',
      playerId: 'player-1',
      matchTime: 900,
      absoluteMatchTime: 940,
      period: 1,
      teamPossession: 'OWN',
      origin: 'post_capture'
    };

    store.addEvent(newEvent);

    const vm = store.allViewModels().find(e => e.id === 'ev-3');
    expect(vm).toBeDefined();
    expect(vm?.playerName).toBe('Juan Pérez');
    expect(vm?.playerJerseyNumber).toBe(10);
    expect(vm?.hasPlayer).toBeTrue();
    expect(vm?.isPostMatch).toBeTrue();
    expect(vm?.absoluteMatchTime).toBe(940);
    expect(vm?.absoluteTimeFormatted).toBe('15:40');
  });

  describe('estimateAbsoluteTime', () => {
    it('should calculate absolute time by projecting previous event pause offset in same period', () => {
      // Evento previo: min 5:30 (330s), absoluto 6:20 (380s) -> offset pausa: 50s
      store.setEvents([
        {
          id: 'ev-prev',
          eventTypeId: 'type-1',
          eventTypeName: 'Try',
          matchTime: 330,
          absoluteMatchTime: 380,
          period: 1,
          teamPossession: 'OWN'
        }
      ]);

      // Nuevo evento: min 5:35 (335s) -> 335 + 50 = 385s (6:25)
      const estimated = store.estimateAbsoluteTime(335, 1);
      expect(estimated).toBe(385);
    });

    it('should add 2 seconds disambiguation if matchTime equals previous event', () => {
      store.setEvents([
        {
          id: 'ev-try',
          eventTypeId: 'type-1',
          eventTypeName: 'Try',
          matchTime: 330,
          absoluteMatchTime: 380,
          period: 1,
          teamPossession: 'OWN'
        }
      ]);

      // Conversión en el mismo segundo de juego (330s) -> 380 + 2 = 382s
      const estimated = store.estimateAbsoluteTime(330, 1);
      expect(estimated).toBe(382);
    });

    it('should return raw matchTime if period 1 has no previous events', () => {
      store.setEvents([]);
      const estimated = store.estimateAbsoluteTime(180, 1);
      expect(estimated).toBe(180);
    });

    it('should anchor to last period 1 event when period 2 has no previous events', () => {
      store.setEvents([
        {
          id: 'ev-p1-last',
          eventTypeId: 'type-1',
          eventTypeName: 'Penal',
          matchTime: 2400,
          absoluteMatchTime: 2650,
          period: 1,
          teamPossession: 'OWN'
        }
      ]);

      // Primer evento de 2T en el min 1 (60s) -> 2650 + 60 = 2710s
      const estimated = store.estimateAbsoluteTime(60, 2);
      expect(estimated).toBe(2710);
    });
  });
});
