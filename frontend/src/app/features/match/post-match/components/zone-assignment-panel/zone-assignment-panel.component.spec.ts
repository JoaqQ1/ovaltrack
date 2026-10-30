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

    it('la ayuda del rango muestra una sola línea y el detalle se despliega con el ícono', () => {
      render();

      expect(query('.range-note')?.textContent?.trim()).toBe('Inicio incluido, fin excluido.');
      expect(query('[data-testid="range-help"]')).toBeNull();

      query<HTMLButtonElement>('[data-testid="range-help-toggle"]')?.click();
      fixture.detectChanges();

      expect(query('[data-testid="range-help"]')?.textContent).toContain('El tiempo añadido cuenta como minuto 40 (1T) y 80 (2T).');
      expect(query('[data-testid="range-help-toggle"]')?.getAttribute('aria-expanded')).toBe('true');
    });

    describe('hoja inferior en móvil', () => {
      const summary = (): string => query('[data-testid="sheet-summary"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const sheet = (): HTMLElement => query('.panel-card.is-sheet') as HTMLElement;

      it('el resumen muestra la zona elegida, el rango y cuántos eventos se vinculan', () => {
        render([], [ev('1', 1, 1), ev('2', 1, 3)]);
        selectCell(2, 4);
        component.startMinute = 0;
        component.endMinute = 5;
        fixture.detectChanges();

        expect(summary()).toContain('Centro · Campo rival');
        expect(query('[data-testid="sheet-range"]')?.textContent).toBe('1T · 0′ a 5′ · 2 eventos');
      });

      it('sin zona ni rango válido pide elegirlos', () => {
        render([{ ...existingZone, startMinute: 0, endMinute: 40 }]);

        expect(summary()).toContain('Elegí una zona en la cancha');
        expect(query('[data-testid="sheet-range"]')?.textContent).toBe('Definí el rango');
      });

      it('"Rango" expande la hoja y "Cerrar" la vuelve a compactar', () => {
        render();
        expect(sheet().classList).not.toContain('is-open');

        query<HTMLButtonElement>('[data-testid="sheet-toggle"]')?.click();
        fixture.detectChanges();
        expect(sheet().classList).toContain('is-open');
        expect(query('[data-testid="sheet-toggle"]')?.textContent?.trim()).toBe('Cerrar');
        expect(query('[data-testid="sheet-toggle"]')?.getAttribute('aria-expanded')).toBe('true');

        query<HTMLButtonElement>('[data-testid="sheet-toggle"]')?.click();
        fixture.detectChanges();
        expect(sheet().classList).not.toContain('is-open');
      });

      it('al guardar, la hoja vuelve a quedar compacta', () => {
        render();
        selectCell(2, 3);
        component.toggleSheet();
        fixture.detectChanges();

        saveButton().click();
        http.expectOne(zonesUrl).flush({ ...existingZone, startMinute: 0, endMinute: 5 });
        flushReload([{ ...existingZone, startMinute: 0, endMinute: 5 }]);
        fixture.detectChanges();

        expect(sheet().classList).not.toContain('is-open');
      });
    });

    describe('estirar un tramo desde la timeline', () => {
      it('carga el tramo para editar con el borde movido, sin guardar nada', () => {
        render([existingZone]);

        component.applyResize(existingZone, 10, 31);
        fixture.detectChanges();

        expect(component.editingId).toBe('zone-1');
        expect(component.selectedCell()).toEqual({ row: 2, col: 3 });
        expect([component.startMinute, component.endMinute]).toEqual([10, 31]);
        expect(store.formRange()).toEqual({ period: 1, startMinute: 10, endMinute: 31 });
        http.expectNone(r => r.method === 'PUT');
      });

      it('tocar Guardar cambios envía el PUT con el rango nuevo', () => {
        render([existingZone]);
        component.applyResize(existingZone, 10, 31);
        fixture.detectChanges();

        saveButton().click();

        const put = http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
        expect(put.request.method).toBe('PUT');
        expect(put.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 31 });
        put.flush(existingZone);
        http.expectOne(zonesUrl).flush(emptyResponse);
        http.expectOne(eventsUrl).flush([]);
      });
    });

    describe('Ir al próximo hueco', () => {
      const nextGapButton = (): HTMLButtonElement | null => query<HTMLButtonElement>('[data-testid="next-gap"]');

      it('precarga el formulario con el siguiente hueco sin zona y lo publica como vista previa', () => {
        render([{ ...existingZone, startMinute: 0, endMinute: 10 }, { ...existingZone, id: 'zone-2', startMinute: 20, endMinute: 30 }]);
        expect([component.startMinute, component.endMinute]).toEqual([10, 15]);

        nextGapButton()?.click();
        fixture.detectChanges();

        expect([component.period, component.startMinute, component.endMinute]).toEqual([1, 30, 40]);
        expect(store.formRange()).toEqual({ period: 1, startMinute: 30, endMinute: 40 });
      });

      it('cuando no quedan huecos muestra "Partido completo" con un check en vez del botón', () => {
        render([
          { ...existingZone, id: 'p1', period: 1, startMinute: 0, endMinute: 40 },
          { ...existingZone, id: 'p2', period: 2, startMinute: 40, endMinute: 80 }
        ]);

        expect(nextGapButton()).toBeNull();
        expect(query('[data-testid="match-complete"]')?.textContent).toContain('Partido completo');
      });
    });

    describe('pickMinute (marcas de eventos)', () => {
      it('con "Desde" ya precargado, un minuto posterior completa "Hasta"', () => {
        render();
        component.startMinute = 10;
        component.endMinute = 15;

        component.pickMinute(1, 30);

        expect([component.startMinute, component.endMinute]).toEqual([10, 30]);
      });

      it('un minuto anterior a "Desde" lo reemplaza y descarta un "Hasta" que quedaría invertido', () => {
        render();
        component.startMinute = 10;
        component.endMinute = 15;

        component.pickMinute(1, 5);
        expect([component.startMinute, component.endMinute]).toEqual([5, 15]);

        component.pickMinute(1, 20);
        component.pickMinute(1, 2);
        expect([component.startMinute, component.endMinute]).toEqual([2, 20]);
      });

      it('sin "Desde" lo completa primero', () => {
        render([{ ...existingZone, startMinute: 0, endMinute: 40 }]);

        component.pickMinute(1, 12);

        expect([component.startMinute, component.endMinute]).toEqual([12, null]);
      });

      it('una marca de otro tiempo cambia de tiempo y arranca el rango en ese minuto', () => {
        render();

        component.pickMinute(2, 55);

        expect([component.period, component.startMinute, component.endMinute]).toEqual([2, 55, null]);
      });

      it('en modo lectura no modifica el formulario', () => {
        render();
        component.readOnly = true;
        const before = [component.period, component.startMinute, component.endMinute];

        component.pickMinute(2, 55);

        expect([component.period, component.startMinute, component.endMinute]).toEqual(before);
      });
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

    it('al guardar con éxito la cancha pulsa la celda guardada', () => {
      render();
      selectCell(2, 3);
      saveButton().click();
      http.expectOne(zonesUrl).flush({ ...existingZone, startMinute: 0, endMinute: 5 });
      flushReload([{ ...existingZone, startMinute: 0, endMinute: 5 }]);

      expect(store.pulseCell()).toEqual({ row: 2, col: 3 });
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

    it('ante un 409 muestra el error inline, conserva el formulario y además avisa con un toast', () => {
      render();
      selectCell(2, 3);
      const error = spyOn(toast, 'error');
      const message = 'El tramo se solapa con el tramo 1T 3\'–8\' ya asignado';

      saveButton().click();
      http.expectOne(zonesUrl).flush({ message }, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(query('[data-testid="server-error"]')?.textContent).toContain('se solapa con el tramo 1T');
      expect(component.selectedCell()).toEqual({ row: 2, col: 3 });
      expect(error).toHaveBeenCalledOnceWith(message);
    });

    it('resalta en la lista el tramo que choca con el rango y lo libera al corregirlo', () => {
      render([existingZone]);
      selectCell(2, 3);
      component.startMinute = 20;
      component.endMinute = 30;

      component.onRangeChange();
      fixture.detectChanges();

      expect(store.conflictId()).toBe('zone-1');
      expect(query('[data-testid="zone-item"]')?.classList).toContain('is-conflict');

      component.startMinute = 25;
      component.onRangeChange();
      fixture.detectChanges();

      expect(store.conflictId()).toBeNull();
      expect(query('[data-testid="zone-item"]')?.classList).not.toContain('is-conflict');
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

    describe('eliminar con "Deshacer"', () => {
      const deleteUrl = (r: { url: string }) => r.url.endsWith('/matches/match-1/zones/zone-1');

      function deleteExistingZone(): void {
        query<HTMLButtonElement>('[data-testid="zone-delete"]')?.click();
        http.expectOne(deleteUrl).flush(null, { status: 204, statusText: 'No Content' });
        flushReload();
        fixture.detectChanges();
      }

      it('quita el tramo de inmediato, sin confirmar, y avisa cuántos eventos quedan sin zona', () => {
        render([existingZone], [ev('1', 1, 12), ev('2', 1, 20), ev('3', 1, 30)]);
        const success = spyOn(toast, 'success');

        query<HTMLButtonElement>('[data-testid="zone-delete"]')?.click();
        const del = http.expectOne(deleteUrl);
        expect(del.request.method).toBe('DELETE');
        del.flush(null, { status: 204, statusText: 'No Content' });
        flushReload();

        expect(query('[data-testid="zone-delete-confirm"]')).toBeNull();
        expect(success).toHaveBeenCalledOnceWith(
          '2 eventos pasan a "Sin zona".', 'Tramo eliminado', 6000,
          jasmine.objectContaining({ label: 'Deshacer' }));
      });

      it('"Deshacer" vuelve a crear el tramo con un POST con los mismos datos', () => {
        render([existingZone]);
        const success = spyOn(toast, 'success');
        deleteExistingZone();

        const action = success.calls.mostRecent().args[3];
        action?.handler();

        const post = http.expectOne(zonesUrl);
        expect(post.request.method).toBe('POST');
        expect(post.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
        post.flush({ ...existingZone, id: 'zone-2' });
        flushReload([{ ...existingZone, id: 'zone-2' }]);

        expect(success).toHaveBeenCalledWith('El tramo volvió a la lista.', 'Tramo restaurado');
      });

      it('si "Deshacer" falla porque el rango ya fue ocupado, avisa el motivo y no duplica el tramo', () => {
        render([existingZone]);
        const success = spyOn(toast, 'success');
        const error = spyOn(toast, 'error');
        deleteExistingZone();

        success.calls.mostRecent().args[3]?.handler();
        http.expectOne(zonesUrl)
          .flush({ message: 'El tramo se solapa con el tramo 1T 12′–20′ ya asignado' }, { status: 409, statusText: 'Conflict' });

        expect(error).toHaveBeenCalledOnceWith('El tramo se solapa con el tramo 1T 12′–20′ ya asignado', 'No se pudo deshacer');
        expect(store.assignments().length).toBe(0);
      });
    });

    it('si falla el borrado muestra el error en la lista', () => {
      render([existingZone]);

      query<HTMLButtonElement>('[data-testid="zone-delete"]')?.click();
      http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'))
        .flush({ message: 'Las zonas solo se pueden editar en partidos finalizados' }, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(query('[data-testid="list-error"]')?.textContent).toContain('partidos finalizados');
    });
  });
});
