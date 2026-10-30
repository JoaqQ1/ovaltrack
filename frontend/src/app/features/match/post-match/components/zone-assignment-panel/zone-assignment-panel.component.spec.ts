import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EventTypeService } from '../../../services/event-type.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { ZoneAssignmentPanelComponent } from './zone-assignment-panel.component';
import { MatchZonesStore } from '../../store/match-zones.store';
import { MatchTimelineEventResponse } from '../../../types/event.types';
import { MatchZonesResponse, ZoneAssignmentResponse } from '../../../types/zone.types';

describe('ZoneAssignmentPanelComponent', () => {
  let fixture: ComponentFixture<ZoneAssignmentPanelComponent>;
  let component: ZoneAssignmentPanelComponent;
  let store: MatchZonesStore;
  let http: HttpTestingController;
  let toast: ToastService;

  const zonesUrl = (r: { url: string }) => r.url.endsWith('/matches/match-1/zones');
  const eventsUrl = (r: { url: string }) => r.url.includes('/event/match/post-match');
  const emptyResponse: MatchZonesResponse = { assignments: [], summary: { cells: [], unzonedEventCount: 0 } };
  const existingZone: ZoneAssignmentResponse = {
    id: 'zone-1', matchId: 'match-1', period: 1, startMinute: 10, endMinute: 25, row: 2, col: 3
  };

  const query = <T extends HTMLElement>(selector: string): T | null => fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));
  const saveButton = (): HTMLButtonElement => query<HTMLButtonElement>('[data-testid="zone-save"]') as HTMLButtonElement;
  const hint = (): string => query('[data-testid="save-hint"]')?.textContent?.trim() ?? '';

  const ev = (id: string, period: 1 | 2, minute: number): MatchTimelineEventResponse => ({
    id, eventTypeId: 't', eventTypeName: 'Tackle', matchTime: minute * 60, period, teamPossession: 'OWN'
  });

  /** Tras escribir, el store recarga tramos y eventos. */
  function flushReload(assignments: ZoneAssignmentResponse[] = []): void {
    http.expectOne(zonesUrl).flush({ assignments, summary: { cells: [], unzonedEventCount: 0 } });
    http.expectOne(eventsUrl).flush([]);
  }

  /** Carga el store como lo hace la página (tramos + eventos) y renderiza el panel. */
  function render(assignments: ZoneAssignmentResponse[] = [], events: MatchTimelineEventResponse[] = []): void {
    store.load('match-1').subscribe();
    http.expectOne(zonesUrl).flush({ assignments, summary: { cells: [], unzonedEventCount: 0 } });
    http.expectOne(eventsUrl).flush(events);
    fixture.componentRef.setInput('matchId', 'match-1');
    fixture.detectChanges();
  }

  function selectCell(row: number, col: number): void {
    fixture.componentRef.setInput('selectedCell', { row, col });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneAssignmentPanelComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EventTypeService, useValue: { getAll: () => of([]) } },
      ],
    }).compileComponents();

    store = TestBed.inject(MatchZonesStore);
    store.reset();
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ZoneAssignmentPanelComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  describe('formulario', () => {
    it('empieza sin zona elegida con el botón deshabilitado y el motivo visible', () => {
      render();

      expect(saveButton().disabled).toBeTrue();
      expect(hint()).toContain('Falta elegir la zona');
      expect(query('[data-testid="selected-cell"]')?.textContent).toContain('Tocá una zona en la cancha');
    });

    it('no propone el tiempo completo por defecto: sugiere 5 minutos', () => {
      render();

      expect(component.startMinute).toBe(0);
      expect(component.endMinute).toBe(5);
    });

    it('sugiere el primer hueco libre, no el inicio del tiempo', () => {
      render([{ ...existingZone, startMinute: 0, endMinute: 10 }]);

      expect([component.startMinute, component.endMinute]).toEqual([10, 15]);
    });

    it('con el tiempo completamente cubierto no sugiere rango y lo explica', () => {
      render([{ ...existingZone, startMinute: 0, endMinute: 40 }]);
      selectCell(2, 3);

      expect([component.startMinute, component.endMinute]).toEqual([null, null]);
      expect(saveButton().disabled).toBeTrue();
      expect(hint()).toContain('minutos enteros');
    });

    it('el motivo que bloquea guardar va debajo del botón, como texto de ayuda', () => {
      render();

      const position = saveButton().compareDocumentPosition(query('[data-testid="save-hint"]') as Element);

      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('al elegir la zona y con un rango válido se habilita guardar y desaparece el motivo', () => {
      render();
      selectCell(2, 3);

      expect(saveButton().disabled).toBeFalse();
      expect(query('[data-testid="save-hint"]')).toBeNull();
      expect(query('[data-testid="selected-cell"]')?.textContent).toContain('C3');
    });

    it('cambiar de tiempo recalcula el rango sugerido', () => {
      render();
      queryAll('.segment')[1].click();
      fixture.detectChanges();

      expect(component.period).toBe(2);
      expect([component.startMinute, component.endMinute]).toEqual([40, 45]);
    });

    it('los botones − y + ajustan el minuto sin salirse del tiempo', () => {
      render();
      component.startMinute = 0;

      component.adjust('start', -1);
      expect(component.startMinute).toBe(0);

      component.adjust('start', 1);
      expect(component.startMinute).toBe(1);

      component.endMinute = 40;
      component.adjust('end', 1);
      expect(component.endMinute).toBe(40);
    });

    it('un rango que choca con otro tramo deshabilita guardar y nombra el tramo en conflicto', () => {
      render([existingZone]);
      selectCell(1, 1);
      component.startMinute = 20;
      component.endMinute = 30;
      fixture.detectChanges();

      expect(saveButton().disabled).toBeTrue();
      expect(hint()).toContain("1T 10'–25'");
    });

    it('un rango con inicio mayor que el fin deshabilita guardar con su motivo', () => {
      render();
      selectCell(1, 1);
      component.startMinute = 20;
      component.endMinute = 10;
      fixture.detectChanges();

      expect(saveButton().disabled).toBeTrue();
      expect(hint()).toContain('menor');
    });
  });

  describe('vista previa de eventos', () => {
    const events = [ev('1', 1, 12), ev('2', 1, 20), ev('3', 1, 30), ev('4', 2, 50)];

    it('informa cuántos eventos se vincularán con el rango del formulario', () => {
      render([], events);
      component.startMinute = 10;
      component.endMinute = 25;
      fixture.detectChanges();

      expect(query('[data-testid="linked-preview"]')?.textContent).toContain('Se vincularán 2 eventos');
    });

    it('usa singular con un solo evento y avisa con cero', () => {
      render([], events);
      component.startMinute = 29;
      component.endMinute = 31;
      fixture.detectChanges();
      expect(query('[data-testid="linked-preview"]')?.textContent).toContain('1 evento');

      component.startMinute = 1;
      component.endMinute = 3;
      fixture.detectChanges();
      expect(query('[data-testid="linked-preview"]')?.textContent).toContain('0 eventos');
    });

    it('no muestra la vista previa mientras el rango no sea válido', () => {
      render([], events);
      component.startMinute = 20;
      component.endMinute = 10;
      fixture.detectChanges();

      expect(query('[data-testid="linked-preview"]')).toBeNull();
    });

    it('al reducir un tramo en edición avisa cuántos eventos pasan a Sin zona', () => {
      render([existingZone], events);
      component.startEdit(existingZone);
      component.endMinute = 15;
      fixture.detectChanges();

      expect(query('[data-testid="released-preview"]')?.textContent).toContain('1 evento pasará');
    });

    it('prefill carga el rango de un hueco y sale del modo edición', () => {
      render([existingZone], events);
      component.startEdit(existingZone);

      component.prefill({ period: 2, startMinute: 40, endMinute: 55 });

      expect([component.period, component.startMinute, component.endMinute, component.editingId]).toEqual([2, 40, 55, null]);
    });
  });

  describe('modo lectura', () => {
    it('oculta el formulario y las acciones de la lista', () => {
      fixture.componentRef.setInput('readOnly', true);
      render([existingZone]);

      expect(query('[data-testid="zone-save"]')).toBeNull();
      expect(query('button[aria-label="Eliminar tramo"]')).toBeNull();
      expect((query('[data-testid="zone-edit"]') as HTMLButtonElement).disabled).toBeTrue();
      expect(queryAll('[data-testid="zone-item"]').length).toBe(1);
    });
  });

  describe('guardado', () => {
    it('crea el tramo con el payload del formulario, recarga y avisa con un toast', () => {
      render();
      selectCell(2, 3);
      const success = spyOn(toast, 'success');

      saveButton().click();

      const post = http.expectOne(zonesUrl);
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 0, endMinute: 5 });
      post.flush({ ...existingZone, startMinute: 0, endMinute: 5 });

      flushReload([{ ...existingZone, startMinute: 0, endMinute: 5 }]);
      fixture.detectChanges();

      expect(success).toHaveBeenCalledWith('Tramo guardado');
      expect(queryAll('[data-testid="zone-item"]').length).toBe(1);
    });

    it('tras guardar, la zona queda sin elegir y "Desde" continúa donde terminó el tramo', () => {
      render();
      selectCell(2, 3);
      saveButton().click();
      http.expectOne(zonesUrl).flush({ ...existingZone, startMinute: 0, endMinute: 5 });
      flushReload([{ ...existingZone, startMinute: 0, endMinute: 5 }]);

      expect(component.selectedCell()).toBeNull();
      expect([component.startMinute, component.endMinute]).toEqual([5, 10]);
    });

    it('ante un 409 muestra el error inline, conserva el formulario y no usa toast de error', () => {
      render();
      selectCell(2, 3);
      const error = spyOn(toast, 'error');

      saveButton().click();
      http.expectOne(zonesUrl).flush({ message: 'El tramo se solapa con el tramo 1T 3\'–8\' ya asignado' },
        { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(query('[data-testid="server-error"]')?.textContent).toContain('se solapa con el tramo 1T');
      expect(component.selectedCell()).toEqual({ row: 2, col: 3 });
      expect(error).not.toHaveBeenCalled();
    });

    it('el error del servidor se limpia al modificar el rango', () => {
      render();
      selectCell(2, 3);
      saveButton().click();
      http.expectOne(zonesUrl).flush({ message: 'Error' }, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      component.onRangeChange();
      fixture.detectChanges();

      expect(query('[data-testid="server-error"]')).toBeNull();
    });
  });

  describe('lista de tramos', () => {
    it('muestra el estado vacío y el contador', () => {
      render();

      expect(query('[data-testid="zones-list-empty"]')).not.toBeNull();
      expect(query('.count-pill')?.textContent).toContain('0 tramos');
    });

    it('lista cada tramo con su etiqueta de zona y su rango', () => {
      render([existingZone]);

      const item = query('[data-testid="zone-item"]');
      expect(item?.textContent).toContain('C3');
      expect(item?.textContent).toContain('1T');
      expect(query('.count-pill')?.textContent).toContain('1 tramo');
    });

    it('con un clic en el tramo lo carga para editar y envía un PUT', () => {
      render([existingZone]);

      query('[data-testid="zone-edit"]')?.click();
      fixture.detectChanges();
      expect(component.selectedCell()).toEqual({ row: 2, col: 3 });
      expect([component.startMinute, component.endMinute]).toEqual([10, 25]);

      saveButton().click();

      const put = http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
      put.flush(existingZone);
      http.expectOne(zonesUrl).flush(emptyResponse);
    });

    it('eliminar pide confirmación inline antes de llamar al backend', () => {
      render([existingZone], [ev('1', 1, 12), ev('2', 1, 20), ev('3', 1, 30)]);

      query<HTMLButtonElement>('button[aria-label="Eliminar tramo"]')?.click();
      fixture.detectChanges();
      expect(query('[data-testid="zone-delete-confirm"]')?.textContent).toContain('Sin zona');
      expect(query('[data-testid="delete-impact"]')?.textContent).toContain('2 eventos pasan');
      http.expectNone(r => r.method === 'DELETE');

      query('[data-testid="zone-delete-yes"]')?.click();

      const del = http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
      expect(del.request.method).toBe('DELETE');
      del.flush(null, { status: 204, statusText: 'No Content' });
      flushReload();
    });

    it('si falla el borrado muestra el error en la lista', () => {
      render([existingZone]);
      query<HTMLButtonElement>('button[aria-label="Eliminar tramo"]')?.click();
      fixture.detectChanges();

      query('[data-testid="zone-delete-yes"]')?.click();
      http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'))
        .flush({ message: 'Las zonas solo se pueden editar en partidos finalizados' }, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(query('[data-testid="list-error"]')?.textContent).toContain('partidos finalizados');
    });
  });
});
