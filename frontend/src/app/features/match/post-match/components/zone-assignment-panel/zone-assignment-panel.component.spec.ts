import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastService } from 'src/app/core/services/toast.service';
import { ZoneAssignmentPanelComponent } from './zone-assignment-panel.component';
import { MatchZonesStore } from '../../store/match-zones.store';
import { MatchZonesResponse, ZoneAssignmentResponse } from '../../../types/zone.types';

describe('ZoneAssignmentPanelComponent', () => {
  let fixture: ComponentFixture<ZoneAssignmentPanelComponent>;
  let component: ZoneAssignmentPanelComponent;
  let store: MatchZonesStore;
  let http: HttpTestingController;
  let toast: ToastService;

  const zonesUrl = (r: { url: string }) => r.url.endsWith('/matches/match-1/zones');
  const emptyResponse: MatchZonesResponse = { assignments: [], summary: { cells: [], unzonedEventCount: 0 } };
  const existingZone: ZoneAssignmentResponse = {
    id: 'zone-1', matchId: 'match-1', period: 1, startMinute: 10, endMinute: 25, row: 2, col: 3
  };

  const query = <T extends HTMLElement>(selector: string): T | null => fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));

  function render(assignments: ZoneAssignmentResponse[] = []): void {
    store.assignments.set(assignments);
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    store = TestBed.inject(MatchZonesStore);
    store.reset();
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ZoneAssignmentPanelComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  it('muestra el estado vacío cuando no hay zonas asignadas', () => {
    render();

    expect(query('[data-testid="zones-list-empty"]')).not.toBeNull();
    expect(queryAll('[data-testid="zone-item"]').length).toBe(0);
  });

  it('lista las zonas existentes', () => {
    render([existingZone]);

    expect(queryAll('[data-testid="zone-item"]').length).toBe(1);
    expect(query('[data-testid="zone-item"]')?.textContent).toContain('10\' – 25\'');
  });

  it('indica que hay que tocar la cancha mientras no haya una zona elegida', () => {
    render();

    expect(query('[data-testid="selected-cell"]')?.textContent).toContain('Tocá una zona en la cancha');
  });

  it('muestra la zona elegida en la cancha', () => {
    render();
    selectCell(2, 3);

    expect(query('[data-testid="selected-cell"]')?.textContent).toContain('Fila 2');
  });

  it('no envía nada y avisa si no se eligió una zona', () => {
    render();
    const warning = spyOn(toast, 'warning');

    query('[data-testid="zone-save"]')?.click();

    expect(warning).toHaveBeenCalled();
    http.expectNone(zonesUrl);
  });

  it('crea la zona con el payload del formulario y recarga la lista', () => {
    render();
    selectCell(2, 3);

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
    expect(component.selectedCell()).toBeNull();
  });

  it('ante un 409 muestra el mensaje del backend y conserva la zona elegida', () => {
    render();
    selectCell(2, 3);
    const error = spyOn(toast, 'error');

    query('[data-testid="zone-save"]')?.click();
    http.expectOne(zonesUrl).flush({ message: 'La zona se solapa con otra zona asignada en el mismo período' },
      { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(error).toHaveBeenCalledWith('La zona se solapa con otra zona asignada en el mismo período');
    expect(component.selectedCell()).toEqual({ row: 2, col: 3 });
  });

  it('al editar carga la zona en el formulario y envía un PUT', () => {
    render([existingZone]);

    query<HTMLButtonElement>('button[aria-label="Editar zona"]')?.click();
    fixture.detectChanges();
    expect(component.selectedCell()).toEqual({ row: 2, col: 3 });

    query('[data-testid="zone-save"]')?.click();

    const put = http.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
    put.flush(existingZone);
    http.expectOne(zonesUrl).flush(emptyResponse);
  });

  it('eliminar pide confirmación antes de llamar al backend', () => {
    render([existingZone]);

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
