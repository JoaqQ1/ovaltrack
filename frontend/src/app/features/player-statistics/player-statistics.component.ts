import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, tap } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { PlayerStatisticsService } from './services/player-statistics.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { EVENT_CODES, otherStats, seasonsOf, sumPlayerStatistics, toHistoryRow, valueByCode } from './utils/player-statistics.utils';
import { PlayerEventTypeValue, PlayerStatColumn, PlayerStatistic } from '../match/statistics/types/statistic.types';
import {
  KickingStat,
  MatchResult,
  PlayerCountStat,
  PlayerKpi,
  PlayerMatchHistory,
  PlayerMatchStatistic,
  PlayerProfile,
  PlayerRoleFilter,
} from './types/player-statistics.types';

/** Tipos que no van en "Juego con la pelota": ya se muestran en puntos, pateo o disciplina, o no son juego. */
const OTHER_STATS_EXCLUDED_CODES: string[] = [
  ...Object.values(EVENT_CODES),
  'PENALTY_TRY',
  'DROP_GOAL',
  'SUBSTITUTION',
  'INJURY',
];

/** Iniciales para el avatar: primera letra del nombre y del apellido. */
function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

const RESULT_LABELS: Record<MatchResult, string> = {
  win: 'G',
  loss: 'P',
  draw: 'E',
};

const ROLE_FILTER_LABELS: Record<PlayerRoleFilter, string> = {
  all: 'Todos',
  starter: 'Titular',
  substitute: 'Suplente',
};

@Component({
  selector: 'app-player-statistics',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './player-statistics.component.html',
  styleUrl: './player-statistics.component.css'
})
export class PlayerStatisticsComponent {
  private readonly playerStatisticsService = inject(PlayerStatisticsService);
  private readonly toastService = inject(ToastService);
  private readonly userContext = inject(UserContextService);

  readonly isLoading = signal<boolean>(true);

  /** Estadísticas de todos los partidos jugados; ante un error queda vacío y se avisa con un toast. */
  readonly matchStatistics = toSignal(
    this.playerStatisticsService.loadAllMatchStatistics().pipe(
      tap(statistics => {
        if (statistics.length === 0) {
          this.toastService.warning('Todavía no jugaste partidos finalizados.', 'Sin partidos');
        }
      }),
      catchError(() => {
        this.toastService.error('No se pudieron cargar tus estadísticas.');
        return of([]);
      }),
      finalize(() => this.isLoading.set(false))
    ),
    { initialValue: [] as PlayerMatchStatistic[] }
  );

  readonly resultLabels = RESULT_LABELS;
  readonly roleFilterLabels = ROLE_FILTER_LABELS;
  readonly roleFilters: readonly PlayerRoleFilter[] = ['all', 'starter', 'substitute'];
  /** Temporadas con partidos jugados, de la más reciente a la más antigua. */
  readonly seasons = computed<string[]>(() => seasonsOf(this.matchStatistics()));

  /** Temporada elegida por el usuario; hasta que elija, la más reciente. */
  private readonly chosenSeason = signal<string | null>(null);
  readonly selectedSeason = computed<string>(() => this.chosenSeason() ?? this.seasons()[0] ?? '');

  readonly roleFilter = signal<PlayerRoleFilter>('all');

  readonly profile = computed<PlayerProfile>(() => {
    const fullName = this.userContext.fullName();
    return {
      fullName,
      initials: initialsOf(fullName),
      clubName: this.userContext.currentClub()?.name ?? '',
      // La división del último partido jugado; sin partidos, la división activa.
      divisionName: this.matchStatistics()[0]?.match.divisionName ?? this.userContext.activeDivisions()[0]?.name ?? '',
    };
  });

  /** Partidos de la temporada elegida (el año de la fecha del partido). */
  readonly seasonStatistics = computed<PlayerMatchStatistic[]>(() =>
    this.matchStatistics().filter(statistic => statistic.match.date.startsWith(this.selectedSeason()))
  );

  readonly history = computed<PlayerMatchHistory[]>(() => this.seasonStatistics().map(toHistoryRow));

  /** Totales de la temporada: suma de las estadísticas de cada partido. */
  readonly total = computed<PlayerStatistic>(() => sumPlayerStatistics(this.seasonStatistics()));

  /** Tipos de evento del catálogo: son los mismos en todos los partidos. */
  readonly columns = computed<PlayerStatColumn[]>(() => this.seasonStatistics()[0]?.columns ?? []);

  readonly kicking = computed<KickingStat[]>(() => {
    const conversions = this.valueOf(EVENT_CODES.CONVERSION);
    const penaltyKicks = this.valueOf(EVENT_CODES.PENALTY_KICK);
    return [
      { label: 'Conversiones', made: conversions.made ?? 0, attempts: conversions.count },
      { label: 'Penales a palos', made: penaltyKicks.made ?? 0, attempts: penaltyKicks.count },
    ];
  });

  readonly playStats = computed<PlayerCountStat[]>(() =>
    otherStats(this.total(), this.columns(), OTHER_STATS_EXCLUDED_CODES)
  );

  readonly disciplineStats = computed<PlayerCountStat[]>(() => [
    { label: 'Penales cometidos', value: this.valueOf(EVENT_CODES.PENALTY_CONCEDED).count },
    { label: 'Amarillas', value: this.valueOf(EVENT_CODES.YELLOW_CARD).count, tone: 'warning' },
    { label: 'Rojas', value: this.valueOf(EVENT_CODES.RED_CARD).count, tone: 'error' },
  ]);

  readonly kpis = computed<PlayerKpi[]>(() => {
    const matches = this.history();
    const starters = matches.filter(m => m.isStarter).length;
    const points = matches.reduce((sum, m) => sum + m.totalPoints, 0);
    const tries = matches.reduce((sum, m) => sum + m.tries, 0);
    const count = (result: MatchResult) => matches.filter(m => m.result === result).length;
    const made = this.kicking().reduce((sum, k) => sum + k.made, 0);
    const attempts = this.kicking().reduce((sum, k) => sum + k.attempts, 0);

    return [
      { label: 'Partidos', value: `${matches.length}`, detail: `${starters} titular · ${matches.length - starters} suplente` },
      { label: 'Puntos', value: `${points}`, detail: `${this.average(points, matches.length)} por partido` },
      { label: 'Tries', value: `${tries}`, detail: 'Apoyados en la temporada' },
      { label: 'Récord con el club', value: `${count('win')}-${count('loss')}-${count('draw')}`, detail: 'G · P · E jugando vos' },
      { label: 'Efectividad de pateo', value: `${this.percentage(made, attempts)}%`, detail: `${made} de ${attempts} a palos` },
    ];
  });

  readonly pointsChart = computed(() => {
    const matches = this.history();
    const max = Math.max(...matches.map(m => m.totalPoints), 1);
    return matches.map(m => ({
      matchId: m.matchId,
      opponent: m.opponent,
      points: m.totalPoints,
      isWin: m.result === 'win',
      heightPercent: Math.round((m.totalPoints / max) * 100),
    }));
  });

  readonly averagePoints = computed(() => {
    const matches = this.history();
    return this.average(matches.reduce((sum, m) => sum + m.totalPoints, 0), matches.length);
  });

  readonly filteredHistory = computed(() => {
    const filter = this.roleFilter();
    return this.history().filter(m =>
      filter === 'all' || (filter === 'starter' ? m.isStarter : !m.isStarter)
    );
  });

  setRoleFilter(filter: PlayerRoleFilter): void {
    this.roleFilter.set(filter);
  }

  setSeason(season: string): void {
    this.chosenSeason.set(season);
  }

  private valueOf(code: string): PlayerEventTypeValue {
    return valueByCode(this.total(), this.columns(), code);
  }

  percentage(made: number, attempts: number): number {
    return attempts === 0 ? 0 : Math.round((made / attempts) * 100);
  }

  private average(total: number, count: number): string {
    return count === 0 ? '0' : (total / count).toFixed(1).replace(/\.0$/, '');
  }
}
