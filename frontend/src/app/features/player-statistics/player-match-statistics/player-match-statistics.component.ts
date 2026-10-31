import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, finalize, map, of, switchMap } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { PlayerStatisticsService } from '../services/player-statistics.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { MatchResult, PlayerKpi, PlayerMatchDTO, PlayerMatchSource, PlayerMatchStatistic, PlayerPeriodFilter, PlayerStatSection } from '../types/player-statistics.types';
import { toMatchHighlights, toResult, toStatSections, unrecordedStats } from '../utils/player-statistics.utils';

interface PlayerMatchData {
  match: PlayerMatchDTO | null;
  source: PlayerMatchSource | null;
}

const NO_MATCH_DATA: PlayerMatchData = { match: null, source: null };

const RESULT_LABELS: Record<MatchResult, string> = {
  win: 'Victoria',
  loss: 'Derrota',
  draw: 'Empate',
};

const PERIOD_FILTERS: readonly { value: PlayerPeriodFilter; label: string }[] = [
  { value: 'ALL', label: 'Partido completo' },
  { value: 1, label: '1.er tiempo' },
  { value: 2, label: '2.º tiempo' },
];

@Component({
  selector: 'app-player-match-statistics',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './player-match-statistics.component.html',
  styleUrl: './player-match-statistics.component.css'
})
export class PlayerMatchStatisticsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly playerStatisticsService = inject(PlayerStatisticsService);
  private readonly toastService = inject(ToastService);
  private readonly userContext = inject(UserContextService);

  readonly isLoading = signal<boolean>(true);
  readonly period = signal<PlayerPeriodFilter>('ALL');

  /** Partido y datos base: se cargan una vez por partido y el período se recalcula en memoria. */ 
  private readonly data = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.loadData(params.get('matchId') ?? ''))
    ),
    { initialValue: NO_MATCH_DATA }
  );

  readonly match = computed<PlayerMatchDTO | null>(() => this.data().match);
  readonly source = computed<PlayerMatchSource | null>(() => this.data().source);

  /** Estadísticas del período elegido; `'ALL'` es el partido completo. */
  readonly statistic = computed<PlayerMatchStatistic | null>(() => {
    const match = this.match();
    const source = this.source();
    if (!match || !source) return null;
    const period = this.period();
    return this.playerStatisticsService.computeMatchStatistic(match, source, period === 'ALL' ? undefined : period);
  });

  readonly highlights = computed<PlayerKpi[]>(() => {
    const statistic = this.statistic();
    return statistic ? toMatchHighlights(statistic) : [];
  });

  readonly sections = computed<PlayerStatSection[]>(() => {
    const statistic = this.statistic();
    return statistic ? toStatSections(statistic) : [];
  });

  readonly unrecorded = computed<string[]>(() => {
    const statistic = this.statistic();
    return statistic ? unrecordedStats(statistic) : [];
  });

  readonly result = computed<MatchResult | null>(() => {
    const match = this.match();
    return match ? toResult(match) : null;
  });

  readonly ownClubName = computed<string>(() => this.userContext.currentClub()?.name || 'Mi club');

  readonly resultLabels = RESULT_LABELS;
  readonly periodFilters = PERIOD_FILTERS;

  setPeriod(period: PlayerPeriodFilter): void {
    this.period.set(period);
  }

  private loadData(matchId: string): Observable<PlayerMatchData> {
    this.isLoading.set(true);

    return this.playerStatisticsService.getMyMatch(matchId).pipe(
      switchMap(match => {
        if (!match) {
          this.toastService.warning('No jugaste este partido o todavía no finalizó.', 'Partido no disponible');
          return of(NO_MATCH_DATA);
        }
        return this.playerStatisticsService.loadMatchSource(matchId).pipe(
          map(source => ({ match, source }))
        );
      }),
      catchError(() => {
        this.toastService.error('No se pudieron cargar las estadísticas del partido.');
        return of(NO_MATCH_DATA);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
}
