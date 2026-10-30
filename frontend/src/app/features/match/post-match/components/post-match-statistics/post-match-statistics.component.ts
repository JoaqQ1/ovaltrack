import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { MatchService } from '../../../services/match.service';
import { EventTypeService } from '../../../services/event-type.service';
import { RosterService } from '../../../services/roster.service';
import { LiveCaptureService } from '../../../services/live-capture.service';
import { StatisticCalculationService } from '../../../statistics/services/statistic-calculation.service';
import { LocalMatchEvent } from '../../../types/event.types';
import { LiveCaptureEventType } from '../../../types/event-type.types';
import { MatchStatistics, PlayerStatistic, PlayerStatistics } from '../../../statistics/types/statistic.types';
import { RosterPlayerInfo } from '../../../statistics/calculators';
import {
  formatMetric,
  formatPlayerValue,
  GroupStatPresentation,
  presentGroups,
  scoringLines,
  StatLine,
} from '../../../statistics/presentation/stat-presentation';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';

export type StatsPeriodFilter = 'ALL' | 1 | 2;
export type StatsTab = 'team' | 'players';

interface StatTile { label: string; value: string; empty: boolean; }
interface StatGroup { title: string; icon: string; tiles: StatTile[]; }
interface RosterGroup { label: string; players: PlayerStatistic[]; }

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
  private readonly cacheService = inject(LocalDatabaseService);
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
  readonly selectedPlayerId = signal<string | null>(null);

  // Datos base: se cargan una sola vez y todo lo demás se recalcula en memoria.
  private readonly events = signal<LocalMatchEvent[]>([]);
  private readonly eventTypes = signal<LiveCaptureEventType[]>([]);
  private readonly roster = signal<RosterPlayerInfo[]>([]);

  /** Eventos de tipos activos: los de tipos dados de baja no se muestran ni cuentan. */
  private readonly visibleEvents = computed(() => {
    const typeIds = new Set(this.eventTypes().map(type => type.id));
    return typeIds.size === 0 ? this.events() : this.events().filter(event => typeIds.has(event.eventTypeId));
  });

  readonly hasEvents = computed(() => this.visibleEvents().length > 0);

  /** Período elegido para el cálculo; `undefined` es el partido completo. */
  private readonly selectedPeriod = computed<number | undefined>(() => {
    const period = this.period();
    return period === 'ALL' ? undefined : period;
  });

  /** Vista `full`: todos los tipos del catálogo y todos sus campos (live y post). */
  readonly stats = computed<MatchStatistics | null>(() => {
    const types = this.eventTypes();
    if (types.length === 0) return null;
    return this.statisticService.computeMatchStatistics(this.visibleEvents(), types, 'full', this.selectedPeriod());
  });

  readonly scoreLines = computed<StatLine[]>(() => scoringLines(this.stats()?.groups ?? []));

  /** Un bloque por `groupName` del catálogo, solo con los grupos que tienen eventos. */
  readonly detailSections = computed<GroupStatPresentation[]>(() =>
    presentGroups(this.stats()?.groups ?? [], { includePoints: true })
      .map(group => ({ ...group, types: group.types.filter(type => type.hasData) }))
      .filter(group => group.hasData)
  );

  private readonly playerStatistics = computed<PlayerStatistics>(() => {
    if (this.eventTypes().length === 0) return { columns: [], players: [] };
    return this.statisticService.computePlayerStatistics(
      this.visibleEvents(), this.roster(), this.eventTypes(), 'full', this.selectedPeriod()
    );
  });

  /** Plantel completo del partido con las estadísticas del período (sin actividad figuran en cero). */
  readonly players = computed<PlayerStatistic[]>(() => this.playerStatistics().players);

  readonly rosterGroups = computed<RosterGroup[]>(() => {
    const all = this.players();
    return [
      { label: 'Titulares', players: all.filter(p => p.isStarter) },
      { label: 'Suplentes', players: all.filter(p => !p.isStarter) },
    ].filter(g => g.players.length > 0);
  });

  /** Se recalcula con el período, por eso la selección se mantiene al cambiar de tiempo. */
  readonly selectedPlayer = computed<PlayerStatistic | null>(() => {
    const id = this.selectedPlayerId();
    return id ? this.players().find(p => p.playerId === id) ?? null : null;
  });

  /** Una tarjeta por `groupName` con los tipos que requieren jugador. */
  readonly selectedPlayerGroups = computed<StatGroup[]>(() => {
    const p = this.selectedPlayer();
    if (!p) return [];
    const groups: StatGroup[] = [{
      title: 'Puntos',
      icon: 'bi-trophy',
      tiles: [{ label: 'Puntos conseguidos', value: p.totalPoints > 0 ? `${p.totalPoints}` : '—', empty: p.totalPoints === 0 }],
    }];
    for (const column of this.playerStatistics().columns) {
      let group = groups.find(candidate => candidate.title === column.groupName);
      if (!group) {
        group = { title: column.groupName, icon: 'bi-bar-chart', tiles: [] };
        groups.push(group);
      }
      const value = p.values[column.eventTypeId];
      group.tiles.push({
        label: column.label,
        value: formatPlayerValue(column, value),
        empty: (value?.count ?? 0) === 0,
      });
    }
    return groups;
  });

  readonly opponentPossession = computed(() =>
    Math.max(0, Math.round((100 - (this.stats()?.ownPossessionPercentage ?? 50)) * 10) / 10)
  );

  readonly formatMetric = formatMetric;

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

  selectPlayer(playerId: string): void {
    this.selectedPlayerId.set(playerId);
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

  /**
   * Sincroniza el catálogo y usa solo los tipos activos: los eventos de tipos dados de baja no se
   * muestran ni cuentan en las estadísticas del post-partido.
   */
  private async loadEventTypes(): Promise<void> {
    try {
      await firstValueFrom(this.eventTypeService.getAll());
    } catch { /* se usa lo que haya en caché */ }
    this.eventTypes.set(await this.cacheService.getActiveEventTypes());
  }

  private async resolveOpponent(matchId: string): Promise<void> {
    try {
      const match = await firstValueFrom(this.matchService.getMatchById(matchId));
      if (match?.opponent) {
        this.opponent.set(match.opponent.name);
        return;
      }
    } catch { /* fallback a caché */ }
    const local = await this.cacheService.getMatch(matchId);
    if (local?.opponent) this.opponent.set(local.opponent.name);
  }

  /**
   * Plantel simplificado: jugadores disponibles del partido (incluye a los que no registraron acciones).
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
}