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
});
