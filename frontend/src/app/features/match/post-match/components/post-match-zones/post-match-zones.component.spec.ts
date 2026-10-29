import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { PostMatchZonesComponent } from './post-match-zones.component';
import { MatchService } from '../../../services/match.service';
import { MatchZonesStore } from '../../store/match-zones.store';
import { Match } from '../../../types/match.types';

describe('PostMatchZonesComponent', () => {
  let fixture: ComponentFixture<PostMatchZonesComponent>;
  let http: HttpTestingController;
  let router: Router;

  const match = { id: 'match-1', opponent: 'Trelew RC', homeScore: 12, awayScore: 7 } as Match;
  const zonesUrl = (r: { url: string }) => r.url.endsWith('/matches/match-1/zones');

  const query = <T extends HTMLElement>(selector: string): T | null => fixture.nativeElement.querySelector(selector);

  function create(id: string | null = 'match-1'): void {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
    });
    fixture = TestBed.createComponent(PostMatchZonesComponent);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMatchZonesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'match-1' }) } } },
        { provide: MatchService, useValue: { getMatchById: () => of(match) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    TestBed.inject(MatchZonesStore).reset();
  });

  afterEach(() => http.verify());

  it('carga las zonas del partido y muestra la cancha con el panel', () => {
    create();
    http.expectOne(zonesUrl).flush({
      assignments: [{ id: 'z1', matchId: 'match-1', period: 1, startMinute: 10, endMinute: 25, row: 2, col: 3 }],
      summary: { cells: [{ row: 2, col: 3, eventCount: 4 }], unzonedEventCount: 1 },
    });
    fixture.detectChanges();

    expect(query('app-rugby-field')).not.toBeNull();
    expect(query('app-zone-assignment-panel')).not.toBeNull();
    expect(query('.hud-title')?.textContent).toContain('Trelew RC');
    expect(query('.match-score-pill')?.textContent).toContain('12 – 7');
  });

  it('muestra el error del backend y permite volver', () => {
    create();
    http.expectOne(zonesUrl).flush({ message: 'Acceso denegado' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(query('.state-box--error')?.textContent).toContain('Acceso denegado');
    expect(query('app-rugby-field')).toBeNull();
  });

  it('sin id de partido no consulta al backend', () => {
    create(null);

    expect(query('.state-box--error')?.textContent).toContain('No se indicó el partido');
    http.expectNone(zonesUrl);
  });

  it('la flecha de retorno navega al análisis del partido', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    create();
    http.expectOne(zonesUrl).flush({ assignments: [], summary: { cells: [], unzonedEventCount: 0 } });
    fixture.detectChanges();

    query<HTMLButtonElement>('.hud-back')?.click();

    expect(navigate).toHaveBeenCalledWith(['/post-match', 'match-1']);
  });
});
