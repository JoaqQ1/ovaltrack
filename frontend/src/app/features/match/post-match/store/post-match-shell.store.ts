import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { MatchService } from '../../services/match.service';
import { Match } from '../../types/match.types';
import { EMPTY_TIME_PLACEHOLDER, formatOnlyTime } from '../utils/match-review.utils';

export type ShellStatus = 'loading' | 'ready' | 'error';

export interface ShellScore { home: number; away: number; }
export interface ShellScoreDelta { text: string; type: 'OWN' | 'OPPONENT'; }

type LoadResult = { match: Match } | { error: unknown };

/**
 * Partido en análisis, cargado una sola vez para las tres vistas (Eventos, Zonas y Estadísticas).
 * Se provee en el shell: vive lo que dura la visita y no se comparte entre partidos.
 */
@Injectable()
export class PostMatchShellStore {
  private readonly matchService = inject(MatchService);
  private readonly loadRequests = new Subject<string>();

  readonly matchId = signal<string>('');
  readonly match = signal<Match | null>(null);
  readonly status = signal<ShellStatus>('loading');
  readonly errorMessage = signal<string>('');

  private readonly liveScore = signal<Signal<ShellScore> | null>(null);
  private readonly liveScoreDelta = signal<Signal<ShellScoreDelta | null> | null>(null);

  /** Marcador del partido; mientras Eventos está activo lo reemplaza por el que calcula con sus eventos. */
  readonly score = computed<ShellScore>(() => {
    const live = this.liveScore();
    if (live) return live();
    const match = this.match();
    return { home: match?.homeScore ?? 0, away: match?.awayScore ?? 0 };
  });

  readonly scoreDelta = computed<ShellScoreDelta | null>(() => this.liveScoreDelta()?.() ?? null);

  readonly startTimeFormatted = computed(() => {
    const startedAt = this.match()?.startedAt;
    return startedAt ? formatOnlyTime(startedAt) : EMPTY_TIME_PLACEHOLDER;
  });

  constructor() {
    this.loadRequests.pipe(
      tap(() => {
        this.match.set(null);
        this.errorMessage.set('');
        this.status.set('loading');
      }),
      switchMap(id => this.matchService.getMatchById(id).pipe(
        map((match): LoadResult => ({ match })),
        catchError(error => of<LoadResult>({ error }))
      )),
      takeUntilDestroyed()
    ).subscribe(result => {
      if ('match' in result) {
        this.match.set(result.match);
        this.status.set('ready');
        return;
      }
      this.errorMessage.set(this.describeError(result.error));
      this.status.set('error');
    });
  }

  load(matchId: string): void {
    this.matchId.set(matchId);
    if (!matchId) {
      this.errorMessage.set('No se indicó el partido.');
      this.status.set('error');
      return;
    }
    this.loadRequests.next(matchId);
  }

  bindLiveScore(score: Signal<ShellScore>, delta: Signal<ShellScoreDelta | null>): void {
    this.liveScore.set(score);
    this.liveScoreDelta.set(delta);
  }

  unbindLiveScore(): void {
    this.liveScore.set(null);
    this.liveScoreDelta.set(null);
  }

  retry(): void {
    this.load(this.matchId());
  }

  private describeError(error: unknown): string {
    const { status, error: body } = (error ?? {}) as { status?: number; error?: { message?: unknown } };
    if (status === 404) return 'No se encontró el partido.';
    return typeof body?.message === 'string' && body.message
      ? body.message
      : 'No se pudo cargar el partido.';
  }
}
