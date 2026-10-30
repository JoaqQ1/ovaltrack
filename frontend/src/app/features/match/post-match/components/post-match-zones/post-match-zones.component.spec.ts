import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { PostMatchZonesComponent } from './post-match-zones.component';
import { MatchService } from '../../../services/match.service';
import { EventTypeService } from '../../../services/event-type.service';
import { MatchZonesStore } from '../../store/match-zones.store';
import { Match } from '../../../types/match.types';
import { MatchTimelineEventResponse } from '../../../types/event.types';
import { ZoneAssignmentResponse } from '../../../types/zone.types';
import { ZoneAssignmentPanelComponent } from '../zone-assignment-panel/zone-assignment-panel.component';

describe('PostMatchZonesComponent', () => {
  let fixture: ComponentFixture<PostMatchZonesComponent>;
  let component: PostMatchZonesComponent;
  let http: HttpTestingController;
  let router: Router;

  const match = { id: 'match-1', opponent: 'Trelew RC', homeScore: 12, awayScore: 7 } as Match;
  const zonesUrl = (r: { url: string }) => r.url.endsWith('/matches/match-1/zones');
  const eventsUrl = (r: { url: string }) => r.url.includes('/event/match/post-match');

  const zone: ZoneAssignmentResponse = { id: 'z1', matchId: 'match-1', period: 1, startMinute: 10, endMinute: 25, row: 2, col: 3 };
  const ev = (id: string, period: 1 | 2, minute: number, cell: { row: number; col: number } | null): MatchTimelineEventResponse => ({
    id, eventTypeId: 't', eventTypeName: 'Tackle', matchTime: minute * 60, period, teamPossession: 'OWN', zone: cell
  });
  const events = [
    ev('a', 1, 12, { row: 2, col: 3 }),
    ev('b', 1, 18, { row: 2, col: 3 }),
    ev('c', 1, 35, null),
    ev('d', 2, 50, null)
  ];

  const query = <T extends HTMLElement>(selector: string): T | null => fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));
  const cell = (row: number, col: number): HTMLElement =>
    queryAll('[data-testid="zone-cell"]').find(c => c.dataset['row'] === String(row) && c.dataset['col'] === String(col)) as HTMLElement;

  function create(id: string | null = 'match-1'): void {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
    });
    fixture = TestBed.createComponent(PostMatchZonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function createLoaded(assignments: ZoneAssignmentResponse[] = [zone], list: MatchTimelineEventResponse[] = events): void {
    create();
    http.expectOne(zonesUrl).flush({ assignments, summary: { cells: [], unzonedEventCount: 0 } });
    http.expectOne(eventsUrl).flush(list);
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
        { provide: EventTypeService, useValue: { getAll: () => of([]) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    TestBed.inject(MatchZonesStore).reset();
  });

  afterEach(() => http.verify());

  describe('carga', () => {
    it('carga tramos y eventos y muestra cancha, línea de tiempo y panel', () => {
      createLoaded();

      expect(query('app-rugby-field')).not.toBeNull();
      expect(query('app-zone-timeline')).not.toBeNull();
      expect(query('app-zone-assignment-panel')).not.toBeNull();
      expect(query('.hud-title')?.textContent).toContain('Trelew RC');
      expect(query('.match-score-pill')?.textContent).toContain('12 – 7');
    });

    it('muestra el error del backend y permite volver', () => {
      create();
      // forkJoin cancela las demás peticiones al primer error: solo se responde la de zonas.
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
      createLoaded([], []);

      query<HTMLButtonElement>('.hud-back')?.click();

      expect(navigate).toHaveBeenCalledWith(['/post-match', 'match-1']);
    });
  });

  describe('indicadores y conteos derivados de los eventos', () => {
    it('muestra los eventos sin zona y la cobertura', () => {
      createLoaded();

      expect(query('[data-testid="unzoned-chip"]')?.textContent).toContain('Sin zona: 2 eventos');
      expect(query('[data-testid="coverage-chip"]')?.textContent).toContain('19%');
    });

    it('la cancha cuenta los eventos de cada celda', () => {
      createLoaded();

      expect(cell(2, 3).querySelector('[data-testid="zone-count"]')?.textContent).toContain('2');
    });

    it('el filtro de tiempo recalcula conteos, sin zona y cobertura', () => {
      createLoaded();

      component.setPeriodFilter(2);
      fixture.detectChanges();

      expect(query('[data-testid="unzoned-chip"]')?.textContent).toContain('Sin zona: 1 evento');
      expect(query('[data-testid="coverage-chip"]')?.textContent).toContain('0%');
      expect(cell(2, 3).querySelector('[data-testid="zone-count"]')).toBeNull();
    });

    it('con todos los eventos vinculados el chip de sin zona queda deshabilitado', () => {
      createLoaded([zone], [ev('a', 1, 12, { row: 2, col: 3 })]);

      expect((query('[data-testid="unzoned-chip"]') as HTMLButtonElement).disabled).toBeTrue();
    });
  });

  describe('modos Asignar zona / Ver eventos', () => {
    it('en modo asignar tocar una celda la elige para el formulario', () => {
      createLoaded();

      cell(1, 2).click();
      fixture.detectChanges();

      expect(component.selectedCell()).toEqual({ row: 1, col: 2 });
      expect(component.viewCell()).toBeNull();
    });

    it('en modo ver eventos tocar una celda lista sus eventos y no toca la zona del formulario', () => {
      createLoaded();
      component.selectedCell.set({ row: 3, col: 6 });
      component.setMode('view');
      fixture.detectChanges();

      cell(2, 3).click();
      fixture.detectChanges();

      expect(component.selectedCell()).toEqual({ row: 3, col: 6 });
      expect(component.viewCell()).toEqual({ row: 2, col: 3 });
      expect(queryAll('[data-testid="event-row"]').length).toBe(2);
    });

    it('en modo ver eventos no hay formulario para editar tramos', () => {
      createLoaded();

      component.setMode('view');
      fixture.detectChanges();

      expect(query('[data-testid="zone-save"]')).toBeNull();
      expect(query('app-zone-events-list')).not.toBeNull();
    });

    it('sin celda elegida la lista pide tocar una zona', () => {
      createLoaded();
      component.setMode('view');
      fixture.detectChanges();

      expect(query('[data-testid="events-hint"]')).not.toBeNull();
    });

    it('el chip de sin zona pasa a modo ver y lista esos eventos', () => {
      createLoaded();

      query<HTMLButtonElement>('[data-testid="unzoned-chip"]')?.click();
      fixture.detectChanges();

      expect(component.mode()).toBe('view');
      expect(queryAll('[data-testid="event-row"]').length).toBe(2);
      expect(query('app-zone-events-list .section-title')?.textContent).toContain('Eventos sin zona');
    });

    it('volver al modo asignar deja de listar los eventos sin zona', () => {
      createLoaded();
      component.showUnzonedEvents();

      component.setMode('assign');

      expect(component.showUnzoned()).toBeFalse();
    });
  });

  describe('línea de tiempo', () => {
    it('tocar un hueco precarga el formulario con ese rango', () => {
      createLoaded();

      const firstGap = query<HTMLButtonElement>('[data-testid="timeline-gap"]');
      firstGap?.click();
      fixture.detectChanges();

      const panel = fixture.debugElement.query(By.directive(ZoneAssignmentPanelComponent)).componentInstance as ZoneAssignmentPanelComponent;
      expect([panel.period, panel.startMinute, panel.endMinute]).toEqual([1, 0, 10]);
    });

    it('tocar un tramo lo carga para editar', () => {
      createLoaded();

      query<HTMLButtonElement>('[data-testid="timeline-segment"]')?.click();
      fixture.detectChanges();

      expect(query('app-zone-assignment-panel .section-title')?.textContent).toContain('Editar tramo');
    });
  });
});
