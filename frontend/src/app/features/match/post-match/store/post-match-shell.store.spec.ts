import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { MatchService } from '../../services/match.service';
import { Match } from '../../types/match.types';
import { PostMatchShellStore } from './post-match-shell.store';

describe('PostMatchShellStore', () => {
  let store: PostMatchShellStore;
  let getMatchById: jasmine.Spy;

  const match = (homeScore: number, awayScore: number): Match => ({ id: 'm1', homeScore, awayScore } as Match);

  beforeEach(() => {
    getMatchById = jasmine.createSpy('getMatchById');
    TestBed.configureTestingModule({
      providers: [PostMatchShellStore, { provide: MatchService, useValue: { getMatchById } }]
    });
    store = TestBed.inject(PostMatchShellStore);
    getMatchById.and.returnValue(of(match(10, 3)));
    store.load('m1');
  });

  it('refresh trae el marcador recalculado sin volver al estado de carga', () => {
    const response = new Subject<Match>();
    getMatchById.and.returnValue(response);

    store.refresh();
    expect(store.status()).toBe('ready');
    expect(store.score()).toEqual({ home: 10, away: 3 });

    response.next(match(7, 3));
    expect(store.score()).toEqual({ home: 7, away: 3 });
  });

  it('si refresh falla, queda el último dato bueno', () => {
    getMatchById.and.returnValue(throwError(() => new Error('offline')));

    store.refresh();

    expect(store.status()).toBe('ready');
    expect(store.score()).toEqual({ home: 10, away: 3 });
  });

  it('una carga nueva cancela el refresh en curso', () => {
    const pending = new Subject<Match>();
    getMatchById.and.returnValue(pending);
    store.refresh();

    getMatchById.and.returnValue(of(match(0, 0)));
    store.load('m1');
    pending.next(match(99, 99));

    expect(store.score()).toEqual({ home: 0, away: 0 });
  });
});
