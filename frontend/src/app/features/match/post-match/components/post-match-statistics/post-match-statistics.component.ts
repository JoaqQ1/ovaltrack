import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
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
import { computePlayerPeriodStats, RosterPlayerInfo } from '../../../services/calculators';
import { PeriodStatisticDTO, PlayerPeriodStatistic } from '../../../types/statistic.types';

export type StatsPeriodFilter = 'ALL' | 1 | 2;
export type StatsTab = 'team' | 'players';

interface CompareRow {
  label: string;
  own: number;
  opponent: number;
  hint?: string;
}

const TACKLE_SUCCESS_THRESHOLD = 70;

@Component({
  selector: 'app-post-match-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match-statistics.component.html',
  styleUrl: './post-match-statistics.component.css',
})
export class MatchStatisticsComponent implements OnInit, OnDestroy {
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

  readonly stats = computed<PeriodStatisticDTO | null>(() => {
    const events = this.events();
    const types = this.eventTypes();
    if (types.length === 0) return null;
    const period = this.period();
    return this.statisticService.computeStatistics(
      this.matchId(),
      period === 'ALL' ? 0 : period,
      events,
      types,
      period !== 'ALL'
    );
  });

  readonly players = computed<PlayerPeriodStatistic[]>(() => {
    const types = this.eventTypes();
    if (types.length === 0) return [];
    const period = this.period();
    const events = period === 'ALL'
      ? this.events()
      : this.events().filter(e => e.period === null || e.period === period);
    const typeMap = new Map(types.map(t => [t.id, t]));

    return computePlayerPeriodStats(events, this.roster(), typeMap)
      .filter(p => p.totalPoints > 0 || p.yellowCards > 0 || p.redCards > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || a.jerseyNumber - b.jerseyNumber);
  });

  readonly opponentPossession = computed(() =>
    Math.max(0, Math.round((100 - (this.stats()?.ownPossessionPercentage ?? 50)) * 10) / 10)
  );

  readonly scoreRows = computed<CompareRow[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Tries', own: s.ownTries, opponent: s.opponentTries, hint: '5 pts (7 si es try penal)' },
      { label: 'Conversiones', own: s.ownConversions, opponent: s.opponentConversions, hint: '2 pts' },
      { label: 'Penales a palos', own: s.ownPenalties, opponent: s.opponentPenalties, hint: '3 pts' },
      { label: 'Drop goals', own: s.ownDropGoals, opponent: s.opponentDropGoals, hint: '3 pts' },
    ];
  });

  readonly disciplineRows = computed<CompareRow[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Penales cometidos', own: s.ownPenaltiesConceded, opponent: s.opponentPenaltiesConceded },
      { label: 'Tarjetas amarillas', own: s.ownYellowCards, opponent: s.opponentYellowCards },
      { label: 'Tarjetas rojas', own: s.ownRedCards, opponent: s.opponentRedCards },
    ];
  });

  readonly turnoverBalance = computed(() => {
    const s = this.stats();
    return s ? s.ownTurnoversWon - s.ownTurnoversLost : 0;
  });

  readonly tackleStatus = computed(() => {
    const s = this.stats();
    if (!s || s.ownTacklesCompleted + s.ownTacklesMissed === 0) {
      return { label: 'Sin datos', type: 'neutral' };
    }
    return s.ownTackleEffectiveness >= TACKLE_SUCCESS_THRESHOLD
      ? { label: 'Bien', type: 'success' }
      : { label: 'A mejorar', type: 'warning' };
  });

  readonly turnoverStatus = computed(() => {
    const s = this.stats();
    if (!s || (s.ownTurnoversWon === 0 && s.ownTurnoversLost === 0)) {
      return { label: 'Sin datos', type: 'neutral' };
    }
    const diff = this.turnoverBalance();
    if (diff > 0) return { label: 'Favorable', type: 'success' };
    if (diff === 0) return { label: 'Parejo', type: 'neutral' };
    return { label: 'Desfavorable', type: 'warning' };
  });

  readonly disciplineStatus = computed(() => {
    const s = this.stats();
    if (!s) return { label: 'Sin datos', type: 'neutral' };
    if (s.ownRedCards > 0 || s.ownPenaltiesConceded > 10) return { label: 'Crítico', type: 'danger' };
    if (s.ownYellowCards > 0 || s.ownPenaltiesConceded > 6) return { label: 'Atención', type: 'warning' };
    return { label: 'Bien', type: 'success' };
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

  formatKicking(p: PlayerPeriodStatistic): string {
    return p.penaltyKicks + p.dropGoals > 0 ? `${p.penaltyKicks} / ${p.dropGoals}` : '—';
  }
}
