import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PendingEventSyncService } from './pending-event-sync.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { ToastService } from '../services/toast.service';
import { buildBackendEventResponse, buildLocalEvent, clearLocalDatabases, nextRequest, settle } from 'src/app/testing/offline-test-helpers';

describe('PendingEventSyncService', () => {
  let service: PendingEventSyncService;
  let cache: LocalDatabaseService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.Spy;

  const isEventPost = (url: string) => (req: { method: string; url: string; body: unknown }) =>
    req.method === 'POST' && req.url.endsWith(url);

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PendingEventSyncService);
    cache = TestBed.inject(LocalDatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
    toastSpy = spyOn(TestBed.inject(ToastService), 'error');
    await clearLocalDatabases();
  });

  afterEach(() => httpMock.verify());

  it('aparta un evento rechazado, avisa y sigue enviando los siguientes', async () => {
    const poisoned = buildLocalEvent({ id: 'event-1', clientEventId: 'event-1', localSequence: 1 });
    const healthy = buildLocalEvent({ id: 'event-2', clientEventId: 'event-2', localSequence: 2 });
    await cache.saveEvent(poisoned);
    await cache.saveEvent(healthy);

    const flushing = service.flush('match-1');
    (await nextRequest(httpMock, isEventPost('/event')))
      .flush({ message: 'El tiempo supera el máximo del periodo' }, { status: 409, statusText: 'Conflict' });
    const second = await nextRequest(httpMock, isEventPost('/event'));
    expect((second.request.body as { clientEventId: string }).clientEventId).toBe('event-2');
    second.flush(buildBackendEventResponse(healthy));
    const synchronized = await flushing;

    expect(synchronized.map(event => event.id)).toEqual(['event-2']);
    expect(await cache.getPendingEvents('match-1')).toEqual([]);
    const { events } = await cache.getStatusData('match-1');
    expect(events.find(event => event.id === 'event-1')).toEqual(jasmine.objectContaining({
      synchronizedAt: null,
      syncAttempts: 1,
      syncErrorMessage: 'El tiempo supera el máximo del periodo',
    }));
    expect(toastSpy).toHaveBeenCalledOnceWith(
      jasmine.stringContaining('El tiempo supera el máximo del periodo'),
      'Sincronización',
    );
  });

  it('ante un error transitorio cuenta el intento, conserva el evento y no envía los siguientes', async () => {
    await cache.saveEvent(buildLocalEvent({ id: 'event-1', localSequence: 1 }));
    await cache.saveEvent(buildLocalEvent({ id: 'event-2', localSequence: 2 }));

    const flushing = service.flush('match-1');
    (await nextRequest(httpMock, isEventPost('/event')))
      .flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    await flushing;

    const pending = await cache.getPendingEvents('match-1');
    expect(pending.map(event => [event.id, event.syncAttempts ?? 0])).toEqual([['event-1', 1], ['event-2', 0]]);
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it('serializa flushes simultáneos para no enviar el mismo evento dos veces', async () => {
    const event = buildLocalEvent();
    await cache.saveEvent(event);

    const first = service.flush('match-1');
    const second = service.flush();
    const create = await nextRequest(httpMock, isEventPost('/event'));
    await settle();
    expect(httpMock.match(isEventPost('/event')).length).withContext('segundo POST en paralelo').toBe(0);
    create.flush(buildBackendEventResponse(event));

    await Promise.all([first, second]);
    expect(await cache.getPendingEvents()).toEqual([]);
  });

  it('vuelve a intentar el borrado de un evento fallido que el usuario elimina', async () => {
    const event = buildLocalEvent({ backendEventId: 'backend-event-1' });
    await cache.saveEvent({ ...event, syncFailedAt: '2026-10-23T15:01:00', syncErrorMessage: 'x' });
    await cache.deleteEvent(event);

    const flushing = service.flush('match-1');
    (await nextRequest(httpMock, req => req.method === 'DELETE' && req.url.endsWith('/event/backend-event-1')))
      .flush(buildBackendEventResponse(event, { active: false }));
    await flushing;

    expect(await cache.getPendingEvents('match-1')).toEqual([]);
  });
});
