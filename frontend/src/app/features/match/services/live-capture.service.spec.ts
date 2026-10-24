import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { LiveCaptureService } from './live-capture.service';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { buildBackendEventResponse, buildLocalEvent, clearLocalDatabases, nextRequest } from '../../../testing/offline-test-helpers';

describe('LiveCaptureService.syncPendingEvents', () => {
  let service: LiveCaptureService;
  let cache: LocalDatabaseService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LiveCaptureService);
    cache = TestBed.inject(LocalDatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
    await clearLocalDatabases();
  });

  afterEach(() => httpMock.verify());

  it('propaga al servidor un borrado hecho mientras la creación estaba en vuelo', async () => {
    const event = buildLocalEvent();
    await cache.saveEvent(event);

    const firstSync = firstValueFrom(service.syncPendingEvents('match-1'));
    const create = await nextRequest(httpMock, req => req.method === 'POST' && req.url.endsWith('/event'));
    await cache.deleteEvent(event);
    create.flush(buildBackendEventResponse(event));
    await firstSync;

    const secondSync = firstValueFrom(service.syncPendingEvents('match-1'));
    const deletion = await nextRequest(httpMock, req => req.method === 'DELETE');
    expect(deletion.request.url).toMatch(/\/event\/backend-event-1$/);
    deletion.flush(buildBackendEventResponse(event, { active: false }));
    await secondSync;

    expect(await cache.getPendingEvents('match-1')).toEqual([]);
    expect(await cache.getEventsByMatch('match-1')).toEqual([]);
  });
});
