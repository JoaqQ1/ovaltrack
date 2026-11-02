import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../services/match.service';
import { RosterService } from '../services/roster.service';
import { StatisticCalculationService } from '../statistics/services/statistic-calculation.service';
import { MatchStatistics, PlayerStatColumn, PlayerStatistic, PlayerStatistics } from '../statistics/types/statistic.types';
import {
  formatMetric,
  formatPlayerValue,
  hasPlayerValue,
  presentGroups,
  scoringLines,
} from '../statistics/presentation/stat-presentation';
import { LiveCapturePersistedState } from '../types/live-capture.types';
import { LiveCaptureService } from '../services/live-capture.service';

import { AvailablePlayer, SavedRoster } from '../types/roster.types';
import { RosterPlayerInfo } from '../statistics/calculators';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { HALF_DURATION_SECONDS } from '../types/match.types';
import { UserContextService } from '../../../core/services/user-context.service';

@Component({
  selector: 'ot-halftime-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './halftime-summary.component.html',
  styleUrl: './halftime-summary.component.css',
})
export class HalftimeSummaryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly matchService = inject(MatchService);
  private readonly rosterService = inject(RosterService);
  private readonly statisticCalculationService = inject(StatisticCalculationService);
  private readonly cacheService = inject(LocalDatabaseService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly userContextService = inject(UserContextService);

  readonly matchId = signal<string>('');
  readonly activeTab = signal<'general' | 'players'>('general');
  readonly currentTheme = signal<'light' | 'dark'>('light');
  readonly isLoading = signal<boolean>(true);
  readonly isOffline = signal<boolean>(!navigator.onLine);
  readonly homeTeam = computed(() => this.userContextService.currentClub()?.name || 'Mi Club');
  readonly opponent = signal<string>('Rival');
  /** Vista `intermediate`: tipos marcados con `stat_view` "intermediate" en el catálogo. */
  readonly generalStats = signal<MatchStatistics | null>(null);
  private readonly playerStatistics = signal<PlayerStatistics>({ columns: [], players: [] });
  readonly playerStats = computed<PlayerStatistic[]>(() => this.playerStatistics().players);
  readonly playerColumns = computed<PlayerStatColumn[]>(() => this.playerStatistics().columns);
  readonly isConfirmingSecondHalf = signal<boolean>(false);
  readonly isStartingSecondHalf = signal<boolean>(false);

  readonly playerFilter = signal<'all' | 'starters' | 'subs' | 'active'>('all');

  readonly startersCount = computed(() => this.playerStats().filter(p => p.isStarter).length);
  readonly subsCount = computed(() => this.playerStats().filter(p => !p.isStarter).length);
  readonly activeCount = computed(() => this.playerStats().filter(p => p.hasActivity).length);

  readonly filteredPlayerStats = computed(() => {
    const stats = this.playerStats();
    switch (this.playerFilter()) {
      case 'starters':
        return stats.filter(p => p.isStarter);
      case 'subs':
        return stats.filter(p => !p.isStarter);
      case 'active':
        return stats.filter(p => p.hasActivity);
      default:
        return stats;
    }
  });

  readonly opponentPossessionPercentage = computed(() => {
    const own = this.generalStats()?.ownPossessionPercentage ?? 0;
    return Math.max(0, 100 - own);
  });

  /** Desglose del marcador: los tipos que suman. */
  readonly scoringLines = computed(() => scoringLines(this.generalStats()?.groups ?? []));

  /** Un bloque por `groupName` con los tipos que no suman (los que suman ya están en el marcador). */
  readonly groupCards = computed(() => {
    const groups = (this.generalStats()?.groups ?? [])
      .map(group => ({ ...group, types: group.types.filter(type => !type.isScoring) }))
      .filter(group => group.types.length > 0);
    return presentGroups(groups, { includePoints: false });
  });

  readonly formatMetric = formatMetric;
  readonly formatPlayerValue = formatPlayerValue;
  readonly hasPlayerValue = hasPlayerValue;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('matchId') || '';
    this.matchId.set(id);

    const handleOnline = () => this.isOffline.set(false);
    const handleOffline = () => this.isOffline.set(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });

    await this.loadSummaryData();
    this.liveCaptureService.syncPendingEvents(id).subscribe();
  }

  async loadSummaryData(): Promise<void> {
    this.isLoading.set(true);
    const id = this.matchId();

    try {
      // 1. Resolver información del partido (Rival / Local)
      await this.resolveMatchInfo(id);

      // Mantener IndexedDB actualizado antes de calcular estadísticas locales.
      await firstValueFrom(this.liveCaptureService.hydrateMatchEvents(id)).catch(() => []);

      // 2. Calcular estadísticas generales del 1° Tiempo
      const general = await this.statisticCalculationService.calculateMatchStatistics(id, 'intermediate', 1);
      this.generalStats.set(general);

      // 3. Resolver plantel y calcular estadísticas individuales de jugadores
      const roster = await this.resolveRoster(id);
      this.playerStatistics.set(
        await this.statisticCalculationService.calculatePlayerStatistics(id, roster, 'intermediate', 1),
      );
    } catch (err) {
      console.error('Error al calcular el resumen de entretiempo:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async resolveMatchInfo(matchId: string): Promise<void> {
    try {
      const match = await firstValueFrom(this.matchService.getMatchById(matchId));
      if (match?.opponent) {
        this.opponent.set(match.opponent.alias);
        return;
      }
    } catch {
      // Fallback a almacenamiento local mediante servicio de caché
    }

    const localMatch = await this.cacheService.getMatch(matchId);
    if (localMatch?.opponent) {
      this.opponent.set(localMatch.opponent.alias);
    }
  }

  private async resolveRoster(matchId: string): Promise<RosterPlayerInfo[]> {
    const { savedRoster, availablePlayers } = await this.fetchRosterData(matchId);
    const rosterMap = new Map<number, RosterPlayerInfo>();

    this.populateRosterFromSavedOrDivision(rosterMap, savedRoster, availablePlayers);
    this.fillRegulatoryRugbySlots(rosterMap, availablePlayers);
    await this.includeAdditionalJerseysFromEvents(rosterMap, matchId, availablePlayers);

    return Array.from(rosterMap.values()).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }

  private async fetchRosterData(matchId: string): Promise<{
    savedRoster: SavedRoster | null;
    availablePlayers: AvailablePlayer[];
  }> {
    try {
      const [rosterRes, playersRes] = await Promise.all([
        firstValueFrom(this.rosterService.getSavedRoster(matchId)).catch(() => null),
        firstValueFrom(this.rosterService.getAvailablePlayers(matchId)).catch(() => []),
      ]);
      return {
        savedRoster: rosterRes,
        availablePlayers: Array.isArray(playersRes) ? playersRes : [],
      };
    } catch {
      return { savedRoster: null, availablePlayers: [] };
    }
  }

  private populateRosterFromSavedOrDivision(
    rosterMap: Map<number, RosterPlayerInfo>,
    savedRoster: SavedRoster | null,
    availablePlayers: AvailablePlayer[]
  ): void {
    if (savedRoster && (savedRoster.startingPlayers.length > 0 || savedRoster.substitutePlayers.length > 0)) {
      // Titulares 1 al 15
      savedRoster.startingPlayers.forEach((playerId, index) => {
        const jerseyNumber = index + 1;
        const playerObj = playerId ? availablePlayers.find(p => p.id === playerId) : null;
        rosterMap.set(
          jerseyNumber,
          this.buildRosterSlot(jerseyNumber, playerObj, {
            playerId,
            isStarter: true,
            fallbackPrefix: 'starter',
          })
        );
      });

      // Suplentes 16 al 23
      savedRoster.substitutePlayers.forEach((playerId, index) => {
        const jerseyNumber = index + 16;
        const playerObj = playerId ? availablePlayers.find(p => p.id === playerId) : null;
        rosterMap.set(
          jerseyNumber,
          this.buildRosterSlot(jerseyNumber, playerObj, {
            playerId,
            isStarter: false,
            fallbackPrefix: 'sub',
          })
        );
      });
    } else if (availablePlayers.length > 0) {
      // Fallback con jugadores de la división ordenados por número de camiseta
      availablePlayers.forEach((playerObj, index) => {
        const jerseyNumber = playerObj.jerseyNumber ?? (index + 1);
        if (!rosterMap.has(jerseyNumber) && jerseyNumber <= 23) {
          rosterMap.set(
            jerseyNumber,
            this.buildRosterSlot(jerseyNumber, playerObj, {
              fallbackPrefix: 'player',
            })
          );
        }
      });
    }
  }

  private fillRegulatoryRugbySlots(
    rosterMap: Map<number, RosterPlayerInfo>,
    availablePlayers: AvailablePlayer[]
  ): void {
    for (let num = 1; num <= 23; num++) {
      if (!rosterMap.has(num)) {
        const playerObj = availablePlayers.find(p => p.jerseyNumber === num);
        rosterMap.set(
          num,
          this.buildRosterSlot(num, playerObj, {
            fallbackPrefix: 'slot',
          })
        );
      }
    }
  }

  private async includeAdditionalJerseysFromEvents(
    rosterMap: Map<number, RosterPlayerInfo>,
    matchId: string,
    availablePlayers: AvailablePlayer[]
  ): Promise<void> {
    const { events } = await this.cacheService.getStatusData(matchId);
    for (const event of events) {
      const playerNum = event.attributes?.['playerNumber'];
      const num = typeof playerNum === 'number' ? playerNum : (playerNum ? Number(playerNum) : null);
      if (num && !isNaN(num) && !rosterMap.has(num)) {
        const playerObj = availablePlayers.find(p => p.jerseyNumber === num || p.id === event.playerId);
        rosterMap.set(
          num,
          this.buildRosterSlot(num, playerObj, {
            playerId: event.playerId,
            fallbackPrefix: 'event-player',
          })
        );
      }
    }
  }

  private buildRosterSlot(
    jerseyNumber: number,
    player?: AvailablePlayer | null,
    options?: {
      playerId?: string | null;
      isStarter?: boolean;
      fallbackPrefix?: string;
    }
  ): RosterPlayerInfo {
    const isStarter = options?.isStarter ?? jerseyNumber <= 15;
    const defaultName = isStarter ? `Titular #${jerseyNumber}` : `Suplente #${jerseyNumber}`;
    const fallbackPrefix = options?.fallbackPrefix ?? (isStarter ? 'starter' : 'sub');
    const playerId = options?.playerId ?? player?.id ?? `${fallbackPrefix}-${jerseyNumber}`;

    return {
      playerId,
      jerseyNumber,
      playerName: player?.fullName ?? defaultName,
      position: player?.position ?? undefined,
      isStarter,
    };
  }

  setPlayerFilter(filter: 'all' | 'starters' | 'subs' | 'active'): void {
    this.playerFilter.set(filter);
  }

  toggleTheme(): void {
    this.currentTheme.update(theme => (theme === 'light' ? 'dark' : 'light'));
  }

  switchTab(tab: 'general' | 'players'): void {
    this.activeTab.set(tab);
  }

  goBackToLiveCapture(): void {
    this.router.navigate(['/live-capture', this.matchId()]);
  }


  openSecondHalfConfirmation(): void {
    this.isConfirmingSecondHalf.set(true);
  }

  closeSecondHalfConfirmation(): void {
    if (!this.isStartingSecondHalf()) {
      this.isConfirmingSecondHalf.set(false);
    }
  }

  async confirmStartSecondHalf(): Promise<void> {
    this.isStartingSecondHalf.set(true);
    const id = this.matchId();

    try {
      // 1. Actualizar estado local para el 2° Tiempo (Minuto 40:00 acumulado)
      const { state: currentState } = await this.cacheService.getStatusData(id);
      const secondHalfState = this.buildSecondHalfState(id, currentState);
      await this.cacheService.saveState(secondHalfState);

      // 2. Notificar al backend
      await firstValueFrom(this.matchService.startSecondHalf(id)).catch(err => {
        console.warn('Backend offline o no disponible al iniciar 2° Tiempo:', err);
      });

      // 3. Redirigir a la pantalla de captura en vivo
      this.router.navigate(['/live-capture', id]);
    } catch (err) {
      console.error('Error al iniciar el 2° Tiempo:', err);
      this.isStartingSecondHalf.set(false);
      this.isConfirmingSecondHalf.set(false);
    }
  }

  private buildSecondHalfState(
    matchId: string,
    currentState?: LiveCapturePersistedState
  ): LiveCapturePersistedState {
    return {
      matchId,
      gameClock: '40:00',
      period: 2,
      periodLabel: '2T',
      synchronized: true,
      isStarted: true,
      clockPaused: false,
      isHalftime: false,
      pendingSelection: null,
      clockElapsedSeconds: Math.max(HALF_DURATION_SECONDS, currentState?.clockElapsedSeconds ?? HALF_DURATION_SECONDS),
      savedAt: Date.now(),
      currentPossession: currentState?.currentPossession ?? 'OWN',
      scoreboard: {
        home: this.generalStats()?.score.own ?? 0,
        away: this.generalStats()?.score.opponent ?? 0,
      },
    };
  }
}
