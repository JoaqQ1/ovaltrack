import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Division } from '../../features/division/types/division.types';
import { LocalDatabaseService } from '../../features/local-database/services/local-database.service';
import { LiveCapturePersistedState } from '../../features/match/types/live-capture.types';
import { Match, MatchStatus } from '../../features/match/types/match.types';
import { UserContextService } from '../services/user-context.service';
import { DexieLiveMatchSource } from './live-match.source';
import { LiveMatchSummary } from './navigation.types';

function captureState(matchId: string, savedAt: number, scoreboard?: { home: number; away: number }): LiveCapturePersistedState {
  return {
    matchId,
    savedAt,
    scoreboard,
    isStarted: true,
    gameClock: '00:00',
    period: 1,
    periodLabel: '1T',
    synchronized: true,
    clockPaused: false,
    pendingSelection: null,
    clockElapsedSeconds: 0,
  };
}

function match(id: string, status: MatchStatus, divisionId = 'div-1', homeScore = 0, awayScore = 0): Match {
  return { id, status, divisionId, homeScore, awayScore } as Match;
}

describe('DexieLiveMatchSource', () => {
  let cache: jasmine.SpyObj<LocalDatabaseService>;
  let matches: Record<string, Match>;
  let source: DexieLiveMatchSource;

  function find(): Promise<LiveMatchSummary | null> {
    return (source as unknown as { findLiveMatch(): Promise<LiveMatchSummary | null> }).findLiveMatch();
  }

  beforeEach(() => {
    localStorage.removeItem('ovaltrack.live-match-visits');
    matches = {};
    cache = jasmine.createSpyObj<LocalDatabaseService>('LocalDatabaseService', ['getCaptureStates', 'getMatch']);
    cache.getCaptureStates.and.resolveTo([]);
    cache.getMatch.and.callFake(async id => matches[id]);

    TestBed.configureTestingModule({
      providers: [
        DexieLiveMatchSource,
        { provide: Router, useValue: { events: new Subject() } },
        { provide: LocalDatabaseService, useValue: cache },
        { provide: UserContextService, useValue: { activeDivisions: signal([{ id: 'div-1', name: 'M18' } as Division]) } },
      ],
    });
    source = TestBed.inject(DexieLiveMatchSource);
  });

  it('sin estados de captura no muestra nada, aunque haya partidos en vivo del club', async () => {
    matches['a'] = match('a', 'in_progress');

    expect(await find()).toBeNull();
  });

  it('con varios estados gana el guardado más recientemente', async () => {
    matches['a'] = match('a', 'in_progress');
    matches['b'] = match('b', 'halftime');
    cache.getCaptureStates.and.resolveTo([captureState('a', 100), captureState('b', 200)]);

    expect(await find()).toEqual(jasmine.objectContaining({ matchId: 'b', status: 'halftime', divisionLabel: 'M18' }));
  });

  it('ignora partidos terminados, cancelados o de divisiones ajenas', async () => {
    matches['a'] = match('a', 'finished');
    matches['b'] = match('b', 'cancelled');
    matches['c'] = match('c', 'in_progress', 'otra');
    matches['d'] = match('d', 'in_progress');
    cache.getCaptureStates.and.resolveTo([
      captureState('a', 400), captureState('b', 300), captureState('c', 200), captureState('d', 100),
    ]);

    expect(await find()).toEqual(jasmine.objectContaining({ matchId: 'd' }));
  });

  it('usa el marcador de la captura y, si no hay, el del partido', async () => {
    matches['a'] = match('a', 'in_progress', 'div-1', 3, 1);
    cache.getCaptureStates.and.resolveTo([captureState('a', 100, { home: 12, away: 7 })]);
    expect(await find()).toEqual(jasmine.objectContaining({ homeScore: 12, awayScore: 7 }));

    cache.getCaptureStates.and.resolveTo([captureState('a', 100)]);
    expect(await find()).toEqual(jasmine.objectContaining({ homeScore: 3, awayScore: 1 }));
  });

  it('un partido abierto en el entretiempo sin estado de captura también se muestra', async () => {
    matches['h'] = match('h', 'halftime', 'div-1', 21, 13);
    localStorage.setItem('ovaltrack.live-match-visits', JSON.stringify({ h: 500 }));

    expect(await find()).toEqual(jasmine.objectContaining({ matchId: 'h', status: 'halftime', homeScore: 21, awayScore: 13 }));
  });
});
