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
              query: { clubId: 'club', divisionId: 'division', matchId: 'match' },
              state: {
                homeTeam: 'PMRC',
                awayTeam: 'DRC',
                scoreboard: { home: 0, away: 0 },
                gameClock: '00:00',
                periodLabel: '1T',
                clockPaused: false,
                currentPossession: 'own',
                synchronized: false,
                history: [],
              },
              recentEvents: [],
              eventTypes: [],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CargaEnVivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should remove a history item directly from the list', () => {
    component.history = [
      { id: 'evt-1', minute: '00:10', description: 'Try — PMRC' },
      { id: 'evt-2', minute: '00:25', description: 'Turnover' },
    ];

    component.removeHistoryEvent('evt-1');

    expect(component.history.map(item => item.id)).toEqual(['evt-2']);
  });

  it('should undo a specific history item using its stored snapshot', () => {
    component.scoreboard = { home: 5, away: 1 };
    component.currentPossession = 'own';

    const snapshot = {
      scoreboard: { home: 3, away: 1 },
      clockPaused: false,
      currentPossession: 'opponent' as const,
      synchronized: true,
      periodLabel: '1T',
      categories: [],
      history: [],
    };

    (component as any).historySnapshots = new Map([['evt-1', snapshot]]);
    component.history = [{ id: 'evt-1', minute: '00:10', description: 'Try — PMRC' }];

    component.undoHistoryEvent('evt-1');

    expect(component.scoreboard.home).toBe(3);
    expect(component.currentPossession).toBe('opponent');
    expect(component.history).toEqual([]);
  });
});
