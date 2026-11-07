import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { MatchSelectComponent } from './match-selection.component';
import { MatchService } from '../services/match.service';
import { RosterService } from '../services/roster.service';
import { buildMatch } from '../../../testing/offline-test-helpers';

describe('MatchSelectionComponent', () => {
  let component: MatchSelectComponent;
  let fixture: ComponentFixture<MatchSelectComponent>;
  let divisionPlayersRequests: string[];
  let availablePlayersRequests: string[];
  let savedRosterRequests: string[];

  beforeEach(async () => {
    divisionPlayersRequests = [];
    availablePlayersRequests = [];
    savedRosterRequests = [];
    await TestBed.configureTestingModule({
      imports: [MatchSelectComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: MatchService,
          useValue: {
            getMatches: () => of([]),
            getAllMatchesByDivisionId: () => of(['match-1', 'match-2', 'match-3']
              .map(id => buildMatch({ id, divisionId: 'division-1', status: 'finished' }))),
            createMatch: () => of({}),
            deleteMatch: () => of(undefined),
          },
        },
        {
          provide: RosterService,
          useValue: {
            getSavedRoster: (matchId: string) => {
              savedRosterRequests.push(matchId);
              return of(null);
            },
            getDivisionPlayers: (divisionId: string) => {
              divisionPlayersRequests.push(divisionId);
              return of([]);
            },
            getAvailablePlayers: (matchId: string) => {
              availablePlayersRequests.push(matchId);
              return of([]);
            },
          },
        },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(MatchSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request the division players once, not once per match, when loading the division matches', () => {
    component.loadMatchesForDivision('division-1');

    expect(divisionPlayersRequests).toEqual(['division-1']);
    expect(availablePlayersRequests).toEqual([]);
    expect(savedRosterRequests).toEqual(['match-1', 'match-2', 'match-3']);
  });

  describe('match without roster (empty_roster)', () => {
    const sameDay = '2026-10-23T15:00:00';
    const multiMonthDay = { view: { type: 'multiMonthYear' }, date: new Date(2026, 9, 23) };

    it('should offer a "Sin plantel" filter that lists only the matches without roster', () => {
      component.matches = [
        buildMatch({ id: 'new', status: 'empty_roster' }),
        buildMatch({ id: 'ready', status: 'not_started' }),
      ];

      component.setFilter('empty_roster');

      expect(component.filters.includes('empty_roster')).toBeTrue();
      expect(component.statusLabels['empty_roster']).toBe('Sin plantel');
      expect(component.visibleMatches.map(match => match.id)).toEqual(['new']);
    });

    it('should label each pending status with the shared status labels', () => {
      expect(component.getDetailedStatusLabel(buildMatch({ status: 'empty_roster' }))).toBe('Sin plantel');
      expect(component.getDetailedStatusLabel(buildMatch({ status: 'not_started' }))).toBe('No iniciado');
      expect(component.getDetailedStatusLabel(buildMatch({ status: 'in_progress' }))).toBe('En progreso');
      expect(component.getDetailedStatusLabel(buildMatch({ status: 'halftime' }))).toBe('Entretiempo');
      expect(component.getDetailedStatusLabel(buildMatch({ status: 'cancelled' }))).toBe('Cancelado');
      expect(component.getDetailedStatusLabel(buildMatch({ status: 'finished', homeScore: 10, awayScore: 3 }))).toBe('Ganado');
    });

    it('should not share the cancelled color', () => {
      const newGameColor = component.getMatchColor(buildMatch({ status: 'empty_roster' }));

      expect(newGameColor).toBe('var(--player)');
      expect(newGameColor).not.toBe(component.getMatchColor(buildMatch({ status: 'cancelled' })));
    });

    it('should paint a day with a match without roster over a finished one', () => {
      component.matches = [
        buildMatch({ id: 'played', date: sameDay, status: 'finished' }),
        buildMatch({ id: 'new', date: sameDay, status: 'empty_roster' }),
      ];

      expect(component.getDayClassNames(multiMonthDay)).toEqual(['day-with-match', 'day-status-new_game']);
    });

    it('should paint a day with a ready match over one without roster', () => {
      component.matches = [
        buildMatch({ id: 'new', date: sameDay, status: 'empty_roster' }),
        buildMatch({ id: 'ready', date: sameDay, status: 'not_started' }),
      ];

      expect(component.getDayClassNames(multiMonthDay)).toEqual(['day-with-match', 'day-status-ready']);
    });
  });
});
