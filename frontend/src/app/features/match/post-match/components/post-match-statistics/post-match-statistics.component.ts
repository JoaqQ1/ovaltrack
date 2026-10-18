import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { MatchService } from '../../../services/match.service';
import { EventTypeService } from '../../../services/event-type.service';
import { RosterService } from '../../../services/roster.service';
import { LiveCaptureCacheService } from '../../../services/live-capture-cache.service';
import { LiveCaptureService } from '../../../services/live-capture.service';
import { StatisticCalculationService } from '../../../services/statistic-calculation.service';
import { LocalMatchEvent } from '../../../types/event.types';
import { LiveCaptureEventType } from '../../../types/event-type.types';
import { RosterPlayerInfo } from '../../../services/calculators';
import { PeriodStatisticDTO } from '../../../types/statistic.types';
import { computeMatchDetailStats, DetailMetric, DetailSection, MatchDetailStatistics } from '../../../services/match-detail-calculator';
import { computePlayerDetailStats, PlayerDetailStatistic } from '../../../services/player-detail-calculator';

export type StatsPeriodFilter = 'ALL' | 1 | 2;
export type StatsTab = 'team' | 'players';

interface CompareRow {
  label: string;
  own: number;
  opponent: number;
  hint?: string;
}

@Component({
  selector: 'app-post-match-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match-statistics.component.html',
  styleUrl: './post-match-statistics.component.css',
})
export class PostMatchStatisticsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly matchService = inject(MatchService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly rosterService = inject(RosterService);
  private readonly cacheService = inject(LiveCaptureCacheService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly statisticService = inject(StatisticCalculationService);
  private readonly userContext = inject(UserContextService);

  readonly matchId = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly opponent = signal<string>('Rival');
  readonly ownClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  readonly activeTab = signal<StatsTab>('team');
  readonly period = signal<StatsPeriodFilter>('ALL');

  // Datos base: se cargan una sola vez y todo lo demás se recalcula en memoria.
  private readonly events = signal<LocalMatchEvent[]>([]);
  private readonly eventTypes = signal<LiveCaptureEventType[]>([]);
  private readonly roster = signal<RosterPlayerInfo[]>([]);

  readonly hasEvents = computed(() => this.events().length > 0);

  private readonly eventTypeMap = computed(() => new Map(this.eventTypes().map(t => [t.id, t])));

  /** Eventos del período seleccionado (los de período null cuentan en ambos tiempos). */
  private readonly periodEvents = computed(() => {
    const period = this.period();
    return period === 'ALL'
      ? this.events()
      : this.events().filter(e => e.period === null || e.period === period);
  });

  readonly stats = computed<PeriodStatisticDTO | null>(() => {
    const types = this.eventTypes();
    if (types.length === 0) return null;
    const period = this.period();
    return this.statisticService.computeStatistics(
      this.matchId(),
      period === 'ALL' ? 0 : period,
      this.events(),
      types,
      period !== 'ALL'
    );
  });

  /** Estadísticas detalladas (todos los campos live/post del catálogo). */
  readonly detail = computed<MatchDetailStatistics>(() => {
    if (this.eventTypes().length === 0) {
      return { sections: [], penaltyTries: { own: 0, opponent: 0 } };
    }
    return computeMatchDetailStats(this.periodEvents(), this.eventTypeMap());
  });

  readonly detailSections = computed<DetailSection[]>(() =>
    this.detail().sections.filter(section =>
      section.metrics.some(m => (m.own ?? 0) !== 0 || (m.opponent ?? 0) !== 0) ||
      section.breakdowns.some(b => b.rows.length > 0)
    )
  );

  readonly players = computed<PlayerDetailStatistic[]>(() => {
    if (this.eventTypes().length === 0) return [];
    return computePlayerDetailStats(this.periodEvents(), this.roster(), this.eventTypeMap())
      .filter(p => p.hasActivity)
      .sort((a, b) => b.totalPoints - a.totalPoints || a.jerseyNumber - b.jerseyNumber);
  });

  readonly opponentPossession = computed(() =>
    Math.max(0, Math.round((100 - (this.stats()?.ownPossessionPercentage ?? 50)) * 10) / 10)
  );

  readonly scoreRows = computed<CompareRow[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const penaltyTries = this.detail().penaltyTries;
    return [
      { label: 'Tries', own: s.ownTries - penaltyTries.own, opponent: s.opponentTries - penaltyTries.opponent, hint: '5 pts' },
      { label: 'Tries penal', own: penaltyTries.own, opponent: penaltyTries.opponent, hint: '7 pts' },
      { label: 'Conversiones', own: s.ownConversions, opponent: s.opponentConversions, hint: '2 pts' },
      { label: 'Penales a palos', own: s.ownPenalties, opponent: s.opponentPenalties, hint: '3 pts' },
      { label: 'Drop goals', own: s.ownDropGoals, opponent: s.opponentDropGoals, hint: '3 pts' },
    ];
  });

  readonly periodLabel = computed(() => {
    const p = this.period();
    return p === 'ALL' ? 'Partido completo' : p === 1 ? 'Primer tiempo' : 'Segundo tiempo';
  });

  async ngOnInit(): Promise<void> {
    this.layoutService.setWide(true);
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.matchId.set(id);
    if (!id) {
      this.errorMessage.set('No se indicó el partido.');
      this.isLoading.set(false);
      return;
    }
    await this.load(id);
  }

  ngOnDestroy(): void {
    this.layoutService.setWide(null);
  }

  setPeriod(period: StatsPeriodFilter): void {
    this.period.set(period);
  }

  switchTab(tab: StatsTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/post-match', this.matchId()]);
  }

  private async load(matchId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await Promise.all([
        this.resolveOpponent(matchId),
        this.hydrateEvents(matchId),
        this.loadEventTypes(),
      ]);

      this.events.set(await this.cacheService.getEventsByMatch(matchId));
      this.roster.set(await this.loadRoster(matchId));
    } catch (err) {
      console.error('Error al cargar las estadísticas del partido:', err);
      this.errorMessage.set('No se pudieron cargar las estadísticas del partido.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async hydrateEvents(matchId: string): Promise<void> {
    try {
      await firstValueFrom(this.liveCaptureService.syncPendingEvents(matchId));
    } catch { /* no bloqueante */ }
    try {
      await firstValueFrom(this.liveCaptureService.hydrateMatchEvents(matchId));
    } catch { /* se usa lo que haya en IndexedDB */ }
  }

  private async loadEventTypes(): Promise<void> {
    try {
      const types = await firstValueFrom(this.eventTypeService.getAll());
      this.eventTypes.set(types as LiveCaptureEventType[]);
    } catch {
      this.eventTypes.set(await this.cacheService.getEventTypes());
    }
  }

  private async resolveOpponent(matchId: string): Promise<void> {
    try {
      const match = await firstValueFrom(this.matchService.getMatchById(matchId));
      if (match?.opponent) {
        this.opponent.set(match.opponent);
        return;
      }
    } catch { /* fallback a caché */ }
    const local = await this.cacheService.getMatch(matchId);
    if (local?.opponent) this.opponent.set(local.opponent);
  }

  /**
   * Plantel simplificado: jugadores disponibles del partido. Solo se muestran los que tienen actividad.
   * Si querés titulares/suplentes exactos, extraé `resolveRoster` del resumen de entretiempo a un servicio compartido.
   */
  private async loadRoster(matchId: string): Promise<RosterPlayerInfo[]> {
    try {
      const players = await firstValueFrom(this.rosterService.getAvailablePlayers(matchId));
      return (Array.isArray(players) ? players : [])
        .filter(p => p.jerseyNumber != null)
        .map(p => ({
          playerId: p.id,
          jerseyNumber: p.jerseyNumber as number,
          playerName: p.fullName,
          position: p.position ?? undefined,
          isStarter: (p.jerseyNumber as number) <= 15,
        }));
    } catch {
      return [];
    }
  }

  barWidth(value: number, other: number): number {
    const total = value + other;
    return total === 0 ? 50 : Math.round((value / total) * 100);
  }

  formatMetric(value: number | null, metric: DetailMetric): string {
    if (value === null) return '—';
    const unit = metric.unit ? ` ${metric.unit}` : '';
    switch (metric.format) {
      case 'percent': return `${value}%`;
      case 'decimal': return `${(Math.round(value * 10) / 10).toFixed(1)}${unit}`;
      default: return `${value}${unit}`;
    }
  }

  isEmptyValue(value: number | null): boolean {
    return value === null || value === 0;
  }

  formatRatio(made: number, attempts: number): string {
    return attempts > 0 ? `${made}/${attempts}` : '—';
  }
}
