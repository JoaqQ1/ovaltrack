import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SelectionRosterComponent } from './selection-roster.component';
import { MatchService } from '../services/match.service';
import { RosterService } from '../services/roster.service';
import { ToastService } from 'src/app/core/services/toast.service';

describe('SelectionRosterComponent', () => {
  let component: SelectionRosterComponent;
  let fixture: ComponentFixture<SelectionRosterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionRosterComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'match-123' : null),
              },
            },
          },
        },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) },
        },
        {
          provide: MatchService,
          useValue: {
            getMatchById: () => of({ id: 'match-123', opponent: 'Rival FC', date: '2026-10-03' }),
          },
        },
        {
          provide: RosterService,
          useValue: {
            getAvailablePlayers: () => of([]),
            getSavedRoster: () => of(null),
            saveRoster: () => of(undefined),
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: () => '1',
            error: () => '2',
            warning: () => '3',
            info: () => '4',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionRosterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

