import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastService } from 'src/app/core/services/toast.service';
import { ZoneAssignmentEditorComponent } from './zone-assignment-editor.component';
import { MatchZonesStore } from '../../store/match-zones.store';
import { MatchZonesResponse, ZoneAssignmentResponse } from '../../../types/zone.types';

describe('ZoneAssignmentEditorComponent', () => {
  let fixture: ComponentFixture<ZoneAssignmentEditorComponent>;
  let http: HttpTestingController;
  let toast: ToastService;

  const zonesUrl = (r: { url: string }) => r.url.endsWith('/matches/match-1/zones');
  const emptyResponse: MatchZonesResponse = { assignments: [], summary: { cells: [], unzonedEventCount: 0 } };
  const existingZone: ZoneAssignmentResponse = {
    id: 'zone-1', matchId: 'match-1', period: 1, startMinute: 10, endMinute: 25, row: 2, col: 3
  };

  const query = <T extends HTMLElement>(selector: string): T | null => fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));

  function open(response: MatchZonesResponse = emptyResponse): void {
    fixture.componentRef.setInput('matchId', 'match-1');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    http.expectOne(zonesUrl).flush(response);
    fixture.detectChanges();
  }

  /** Celda (fila 2, columna 3) del selector 3x6. */
  const pickCell = (): void => {
    queryAll('[data-testid="zone-pick"]')[8].click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneAssignmentEditorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    TestBed.inject(MatchZonesStore).reset();
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ZoneAssignmentEditorComponent);
  });

  afterEach(() => http.verify());

  it('al abrirse carga las zonas del partido y muestra el estado vacío', () => {
    open();

    expect(query('[data-testid="zones-list-empty"]')).not.toBeNull();
    expect(queryAll('[data-testid="zone-item"]').length).toBe(0);
  });

  it('lista las zonas existentes', () => {
    open({ assignments: [existingZone], summary: { cells: [], unzonedEventCount: 0 } });

    expect(queryAll('[data-testid="zone-item"]').length).toBe(1);
    expect(query('[data-testid="zone-item"]')?.textContent).toContain('10\' – 25\'');
  });

  it('dibuja los 18 botones de la grilla 3x6', () => {
    open();

    expect(queryAll('[data-testid="zone-pick"]').length).toBe(18);
  });

  it('no envía nada y avisa si no se eligió una celda', () => {
    open();
    const warning = spyOn(toast, 'warning');

    query('[data-testid="zone-save"]')?.click();

    expect(warning).toHaveBeenCalled();
    http.expectNone(zonesUrl);
  });

  it('crea la zona con el payload del formulario y recarga la lista', () => {
    open();
    pickCell();

    query('[data-testid="zone-save"]')?.click();

    const post = http.expectOne(zonesUrl);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 0, endMinute: 40 });
    post.flush({ ...existingZone, startMinute: 0, endMinute: 40 });

    http.expectOne(zonesUrl).flush({
      assignments: [{ ...existingZone, startMinute: 0, endMinute: 40 }],
      summary: { cells: [], unzonedEventCount: 0 },
    });
    fixture.detectChanges();

    expect(queryAll('[data-testid="zone-item"]').length).toBe(1);
    expect(query('.cell-pick.is-selected')).toBeNull();
  });

  it('ante un 409 muestra el mensaje del backend y conserva el formulario', () => {
    open();
    pickCell();
    const error = spyOn(toast, 'error');

    query('[data-testid="zone-save"]')?.click();
    http.expectOne(zonesUrl).flush({ message: 'La zona se solapa con otra zona asignada en el mismo período' },
      { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(error).toHaveBeenCalledWith('La zona se solapa con otra zona asignada en el mismo período');
    expect(query('.cell-pick.is-selected')).not.toBeNull();
  });

  it('al editar envía un PUT sobre la zona elegida', () => {
    open({ assignments: [existingZone], summary: { cells: [], unzonedEventCount: 0 } });

    query<HTMLButtonElement>('button[aria-label="Editar zona"]')?.click();
    fixture.detectChanges();
    query('[data-testid="zone-save"]')?.click();

    const put = http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
    put.flush(existingZone);
    http.expectOne(zonesUrl).flush(emptyResponse);
  });

  it('eliminar pide confirmación antes de llamar al backend', () => {
    open({ assignments: [existingZone], summary: { cells: [], unzonedEventCount: 0 } });

    query<HTMLButtonElement>('button[aria-label="Eliminar zona"]')?.click();
    fixture.detectChanges();
    expect(query('[data-testid="zone-delete-confirm"]')).not.toBeNull();
    http.expectNone(r => r.method === 'DELETE');

    query('[data-testid="zone-delete-yes"]')?.click();

    const del = http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne(zonesUrl).flush(emptyResponse);
  });
});
