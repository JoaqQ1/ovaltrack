import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PendingMatchMutationSyncService } from './pending-match-mutation-sync.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { PendingMatchMutation } from 'src/app/features/match/types/match.types';
import { ToastService } from '../services/toast.service';
import { buildBackendMatch, buildMatch, clearLocalDatabases, nextRequest } from 'src/app/testing/offline-test-helpers';

describe('PendingMatchMutationSyncService', () => {
  let service: PendingMatchMutationSyncService;
  let cache: LocalDatabaseService;
  let httpMock: HttpTestingController;

  const secondHalfMutation: PendingMatchMutation = {
    id: 'match-1-latest',
    matchId: 'match-1',
    action: 'start-second-half',
    createdAt: 1,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PendingMatchMutationSyncService);
    cache = TestBed.inject(LocalDatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
    await clearLocalDatabases();
  });

  afterEach(() => httpMock.verify());

  it('envía la mutación pendiente y la elimina al confirmarse', async () => {
    await cache.saveMatches([buildMatch({ status: 'halftime' })]);
    await cache.savePendingMatchMutation(secondHalfMutation);

    const flushing = service.flush();
    const request = await nextRequest(httpMock, req => req.url.endsWith('/matches/match-1/start-second-half'));
    expect(request.request.method).toBe('PUT');
    request.flush(buildBackendMatch({ status: 'IN_PROGRESS', currentPeriod: 2 }));
    await flushing;

    expect(await cache.getPendingMatchMutations()).toEqual([]);
    expect((await cache.getMatch('match-1'))?.status).toBe('in_progress');
  });

  it('conserva la mutación cuando el envío falla por falta de red', async () => {
    await cache.saveMatches([buildMatch({ status: 'halftime' })]);
    await cache.savePendingMatchMutation(secondHalfMutation);

    const flushing = service.flush();
    const request = await nextRequest(httpMock, req => req.url.endsWith('/start-second-half'));
    request.error(new ProgressEvent('error'), { status: 0 });
    await flushing;

    expect(await cache.getPendingMatchMutations()).toEqual([secondHalfMutation]);
  });

  it('no borra una mutación más nueva encolada mientras la anterior estaba en vuelo', async () => {
    await cache.saveMatches([buildMatch({ status: 'in_progress' })]);
    await cache.savePendingMatchMutation({ ...secondHalfMutation, action: 'close-first-half' });

    const flushing = service.flush();
    const request = await nextRequest(httpMock, req => req.url.endsWith('/close-first-half'));
    const newerMutation: PendingMatchMutation = { ...secondHalfMutation, createdAt: 2 };
    await cache.savePendingMatchMutation(newerMutation);
    await cache.saveMatches([buildMatch({ status: 'in_progress', currentPeriod: 2 })]);
    request.flush(buildBackendMatch({ status: 'HALFTIME' }));
    await flushing;

    expect(await cache.getPendingMatchMutations()).toEqual([newerMutation]);
    expect((await cache.getMatch('match-1'))?.status)
      .withContext('la respuesta vieja no pisa el estado local más nuevo')
      .toBe('in_progress');
  });

  it('descarta una mutación rechazada, restaura el estado del servidor, avisa y sigue con las demás', async () => {
    const toastSpy = spyOn(TestBed.inject(ToastService), 'warning');
    await cache.saveMatches([buildMatch({ id: 'match-1', status: 'in_progress' })]);
    await cache.savePendingMatchMutation({ id: 'match-1-latest', matchId: 'match-1', action: 'start', createdAt: 1 });
    await cache.savePendingMatchMutation({ id: 'match-2-latest', matchId: 'match-2', action: 'start', createdAt: 2 });

    const flushing = service.flush();
    (await nextRequest(httpMock, req => req.url.endsWith('/match-1/start')))
      .flush({ message: 'El partido fue cancelado' }, { status: 409, statusText: 'Conflict' });
    (await nextRequest(httpMock, req => req.url.endsWith('/match-1/live-state')))
      .flush(buildBackendMatch({ id: 'match-1', status: 'CANCELLED' }));
    (await nextRequest(httpMock, req => req.url.endsWith('/match-2/start')))
      .flush(buildBackendMatch({ id: 'match-2' }));
    await flushing;

    expect(await cache.getPendingMatchMutations()).toEqual([]);
    expect((await cache.getMatch('match-1'))?.status).toBe('cancelled');
    expect(toastSpy).toHaveBeenCalledOnceWith(jasmine.stringContaining('El partido fue cancelado'), 'Sincronización');
  });

  it('no avisa si el servidor ya estaba en el estado de la transición rechazada', async () => {
    const toastSpy = spyOn(TestBed.inject(ToastService), 'warning');
    await cache.savePendingMatchMutation({ id: 'match-1-latest', matchId: 'match-1', action: 'start', createdAt: 1 });

    const flushing = service.flush();
    (await nextRequest(httpMock, req => req.url.endsWith('/match-1/start')))
      .flush({ message: 'El partido ya fue iniciado' }, { status: 409, statusText: 'Conflict' });
    (await nextRequest(httpMock, req => req.url.endsWith('/match-1/live-state')))
      .flush(buildBackendMatch({ status: 'IN_PROGRESS' }));
    await flushing;

    expect(await cache.getPendingMatchMutations()).toEqual([]);
    expect(toastSpy).not.toHaveBeenCalled();
  });
});
