import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActiveMatchPullService } from './active-match-pull.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import {
  buildBackendEventResponse, buildBackendMatch, buildLocalEvent, buildMatch, clearLocalDatabases, nextRequest, settle,
} from 'src/app/testing/offline-test-helpers';

describe('ActiveMatchPullService', () => {
  let service: ActiveMatchPullService;
  let cache: LocalDatabaseService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ActiveMatchPullService);
    cache = TestBed.inject(LocalDatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
    await clearLocalDatabases();
  });

  afterEach(() => httpMock.verify());

  it('actualiza marcador y eventos de los partidos en juego cacheados', async () => {
    const kept = buildLocalEvent({ id: 'kept', backendEventId: 'b-kept', synchronizedAt: '2026-10-23T15:00:05' });
    const deletedElsewhere = buildLocalEvent({ id: 'gone', localSequence: 2, backendEventId: 'b-gone', synchronizedAt: '2026-10-23T15:00:05' });
    await cache.saveMatches([
      buildMatch({ id: 'match-1', status: 'in_progress', homeScore: 0 }),
      buildMatch({ id: 'match-2', status: 'finished' }),
    ]);
    await cache.saveEvent(kept);
    await cache.saveEvent(deletedElsewhere);

    const pulling = service.pull();
    (await nextRequest(httpMock, req => req.url.endsWith('/matches/match-1/live-state')))
      .flush(buildBackendMatch({ id: 'match-1', homeScore: 7 }));
    (await nextRequest(httpMock, req => req.url.includes('/event/match?matchId=match-1')))
      .flush([buildBackendEventResponse(kept)]);
    await pulling;

    expect((await cache.getMatch('match-1'))?.homeScore).toBe(7);
    expect((await cache.getEventsByMatch('match-1')).map(event => event.id)).toEqual(['kept']);
    expect(httpMock.match(req => req.url.includes('match-2')).length)
      .withContext('los partidos terminados no se consultan')
      .toBe(0);
  });

  it('no pisa un partido con una transición todavía sin enviar', async () => {
    await cache.saveMatches([buildMatch({ status: 'halftime' })]);
    await cache.savePendingMatchMutation({ id: 'match-1-latest', matchId: 'match-1', action: 'close-first-half', createdAt: 1 });

    await service.pull();
    await settle();

    expect(httpMock.match(() => true).length).toBe(0);
    expect((await cache.getMatch('match-1'))?.status).toBe('halftime');
  });
});
