import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ZoneService } from './zone.service';
import { ZoneAssignmentRequest, ZoneAssignmentResponse, MatchZonesResponse } from '../types/zone.types';

describe('ZoneService', () => {
  let service: ZoneService;
  let httpMock: HttpTestingController;

  const request: ZoneAssignmentRequest = { row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 };
  const assignment: ZoneAssignmentResponse = { id: 'zone-1', matchId: 'match-1', ...request };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ZoneService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista las zonas y el resumen del partido', () => {
    const body: MatchZonesResponse = {
      assignments: [assignment],
      summary: { cells: [{ row: 2, col: 3, eventCount: 2 }], unzonedEventCount: 1 },
    };
    let result: MatchZonesResponse | undefined;

    service.list('match-1').subscribe(response => (result = response));

    const req = httpMock.expectOne(r => r.url.endsWith('/matches/match-1/zones'));
    expect(req.request.method).toBe('GET');
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('crea una zona con POST y devuelve la asignación', () => {
    let result: ZoneAssignmentResponse | undefined;

    service.create('match-1', request).subscribe(response => (result = response));

    const req = httpMock.expectOne(r => r.url.endsWith('/matches/match-1/zones'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(assignment);
    expect(result).toEqual(assignment);
  });

  it('actualiza una zona con PUT', () => {
    service.update('match-1', 'zone-1', request).subscribe();

    const req = httpMock.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(assignment);
  });

  it('elimina una zona con DELETE', () => {
    let completed = false;

    service.remove('match-1', 'zone-1').subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(r => r.url.endsWith('/matches/match-1/zones/zone-1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBeTrue();
  });

  it('propaga el error 409 del backend sin ocultarlo', () => {
    let status: number | undefined;
    let message: string | undefined;

    service.create('match-1', request).subscribe({
      error: err => {
        status = err.status;
        message = err.error?.message;
      },
    });

    httpMock
      .expectOne(r => r.url.endsWith('/matches/match-1/zones'))
      .flush({ message: 'La zona se solapa con otra' }, { status: 409, statusText: 'Conflict' });

    expect(status).toBe(409);
    expect(message).toBe('La zona se solapa con otra');
  });
});
