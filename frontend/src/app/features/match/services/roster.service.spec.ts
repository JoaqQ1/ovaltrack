import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { RosterService } from './roster.service';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { AvailablePlayer } from '../types/roster.types';
import { buildBackendMatch, buildMatch, clearLocalDatabases, nextRequest } from '../../../testing/offline-test-helpers';

const players: AvailablePlayer[] = [
  { id: 'p-1', fullName: 'Uno', jerseyNumber: 1, position: null },
  { id: 'p-2', fullName: 'Dos', jerseyNumber: 2, position: null },
];

describe('RosterService', () => {
  let service: RosterService;
  let cache: LocalDatabaseService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RosterService);
    cache = TestBed.inject(LocalDatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
    await clearLocalDatabases();
  });

  afterEach(() => httpMock.verify());

  describe('getAvailablePlayers', () => {
    it('busca la división del partido, trae sus jugadores y los deja en Dexie', async () => {
      const loading = firstValueFrom(service.getAvailablePlayers('match-1'));
      (await nextRequest(httpMock, req => req.url.endsWith('/matches/match-1')))
        .flush(buildBackendMatch({ divisionId: 'division-1' }));
      (await nextRequest(httpMock, req => req.url.endsWith('/division/division-1/players')))
        .flush(players);

      expect(await loading).toEqual(players);
      expect((await cache.getPersonsByDivisionId('division-1')).map(player => player.id))
        .toEqual(['p-1', 'p-2']);
    });

    it('sin red devuelve los jugadores de la división guardados en Dexie', async () => {
      await cache.saveMatches([buildMatch({ divisionId: 'division-1' })]);
      await cache.savePersonsByDivisionId(players.map(player => ({ ...player, divisionId: 'division-1' })));

      const loading = firstValueFrom(service.getAvailablePlayers('match-1'));
      (await nextRequest(httpMock, req => req.url.endsWith('/matches/match-1')))
        .error(new ProgressEvent('error'), { status: 0 });

      expect((await loading).map(player => player.id)).toEqual(['p-1', 'p-2']);
    });
  });
});
