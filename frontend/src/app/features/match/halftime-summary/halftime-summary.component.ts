import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../services/match.service';
import { RosterService } from '../services/roster.service';
import { StatisticCalculationService } from '../services/statistic-calculation.service';
import { PeriodStatisticDTO, PlayerPeriodStatistic } from '../types/statistic.types';
import { RosterPlayerInfo } from '../services/calculators';
import { liveCaptureDatabase, matchDatabase } from '../data/local-databases';
import { SavedRoster } from '../types/roster.types';

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
  private readonly matchService = inject(MatchService);
  private readonly rosterService = inject(RosterService);
  private readonly statisticCalculationService = inject(StatisticCalculationService);

  readonly matchId = signal<string>('');
  readonly activeTab = signal<'general' | 'players'>('general');
  readonly currentTheme = signal<'light' | 'dark'>('light');
  readonly isLoading = signal<boolean>(true);
  readonly isOffline = signal<boolean>(!navigator.onLine);
  readonly homeTeam = signal<string>('Cardenales');
  readonly opponent = signal<string>('Rival');
  readonly generalStats = signal<PeriodStatisticDTO | null>(null);
  readonly playerStats = signal<PlayerPeriodStatistic[]>([]);
  readonly isConfirmingSecondHalf = signal<boolean>(false);
  readonly isStartingSecondHalf = signal<boolean>(false);

  readonly playerFilter = signal<'all' | 'starters' | 'subs' | 'active'>('all');

  readonly startersCount = computed(() => this.playerStats().filter(p => p.isStarter).length);
  readonly subsCount = computed(() => this.playerStats().filter(p => !p.isStarter).length);
  readonly activeCount = computed(() => this.playerStats().filter(p => p.totalPoints > 0 || p.yellowCards > 0 || p.redCards > 0).length);

  readonly filteredPlayerStats = computed(() => {
    const stats = this.playerStats();
    const filter = this.playerFilter();
    switch (filter) {
      case 'starters':
        return stats.filter(p => p.isStarter);
      case 'subs':
        return stats.filter(p => !p.isStarter);
      case 'active':
        return stats.filter(p => p.totalPoints > 0 || p.yellowCards > 0 || p.redCards > 0);
      default:
        return stats;
    }
  });

  readonly opponentPossessionPercentage = computed(() => {
    const own = this.generalStats()?.ownPossessionPercentage ?? 0;
    return Math.max(0, 100 - own);
  });

  readonly tackleStatus = computed(() => {
    const stats = this.generalStats();
    if (!stats || (stats.ownTacklesCompleted + stats.ownTacklesMissed === 0)) {
      return { label: 'Sin datos', type: 'neutral' };
    }
    return stats.ownTackleEffectiveness >= 70
      ? { label: 'Bien', type: 'success' }
      : { label: 'A mejorar', type: 'warning' };
  });

  readonly turnoverStatus = computed(() => {
    const stats = this.generalStats();
    if (!stats || (stats.ownTurnoversWon === 0 && stats.ownTurnoversLost === 0)) {
      return { label: 'Sin datos', type: 'neutral' };
    }
    const diff = stats.ownTurnoversWon - stats.ownTurnoversLost;
    if (diff > 0) return { label: 'Favorable', type: 'success' };
    if (diff === 0) return { label: 'Parejo', type: 'neutral' };
    return { label: 'Desfavorable', type: 'warning' };
  });

  readonly disciplineStatus = computed(() => {
    const stats = this.generalStats();
    if (!stats) return { label: 'Bien', type: 'success' };
    if (stats.ownRedCards > 0 || stats.ownPenaltiesConceded > 6) {
      return { label: 'Crítico', type: 'danger' };
    }
    if (stats.ownYellowCards > 0 || stats.ownPenaltiesConceded > 3) {
      return { label: 'Atención', type: 'warning' };
    }
    return { label: 'Bien', type: 'success' };
  });

  readonly setPieceStatus = computed(() => {
    const stats = this.generalStats();
    if (!stats || (stats.scrumsTotal + stats.lineoutsTotal === 0)) {
      return { label: 'Sin datos', type: 'neutral' };
    }
    return { label: 'Registradas', type: 'neutral' };
  });


  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('matchId') || '';
    this.matchId.set(id);

    window.addEventListener('online', () => this.isOffline.set(false));
    window.addEventListener('offline', () => this.isOffline.set(true));

    await this.loadSummaryData();
  }

  async loadSummaryData(): Promise<void> {
    this.isLoading.set(true);
    const id = this.matchId();

    try {
      // 1. Resolver información del partido (Rival / Local)
      await this.resolveMatchInfo(id);

      // 2. Calcular estadísticas generales del 1° Tiempo
      const general = await this.statisticCalculationService.calculatePeriodStatistics(id, 1);
      this.generalStats.set(general);

      // 3. Resolver plantel y calcular estadísticas individuales de jugadores
      const roster = await this.resolveRoster(id);
      const players = await this.statisticCalculationService.calculatePlayerStatistics(id, roster, 1);
      this.playerStats.set(players);
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
        this.opponent.set(match.opponent);
        return;
      }
    } catch {
      // Fallback a almacenamiento local Dexie
    }

    const localMatch = await matchDatabase.matches.get(matchId);
    if (localMatch?.opponent) {
      this.opponent.set(localMatch.opponent);
    }
  }

  private async resolveRoster(matchId: string): Promise<RosterPlayerInfo[]> {
    let savedRoster: SavedRoster | null = null;
    let availablePlayers: any[] = [];

    try {
      const [rosterRes, playersRes] = await Promise.all([
        firstValueFrom(this.rosterService.getSavedRoster(matchId)).catch(() => null),
        firstValueFrom(this.rosterService.getAvailablePlayers(matchId)).catch(() => []),
      ]);
      savedRoster = rosterRes;
      availablePlayers = Array.isArray(playersRes) ? playersRes : [];
    } catch {
      // Offline fallback
    }

    const rosterMap = new Map<number, RosterPlayerInfo>();

    if (savedRoster && (savedRoster.startingPlayers.length > 0 || savedRoster.substitutePlayers.length > 0)) {
      // Titulares 1 al 15
      savedRoster.startingPlayers.forEach((playerId, index) => {
        const jerseyNumber = index + 1;
        const playerObj = playerId ? availablePlayers.find(p => p.id === playerId) : null;
        rosterMap.set(jerseyNumber, {
          playerId: playerId ?? `starter-${jerseyNumber}`,
          jerseyNumber,
          playerName: playerObj?.fullName ?? `Titular #${jerseyNumber}`,
          position: playerObj?.position,
          isStarter: true,
        });
      });

      // Suplentes 16 al 23
      savedRoster.substitutePlayers.forEach((playerId, index) => {
        const jerseyNumber = index + 16;
        const playerObj = playerId ? availablePlayers.find(p => p.id === playerId) : null;
        rosterMap.set(jerseyNumber, {
          playerId: playerId ?? `sub-${jerseyNumber}`,
          jerseyNumber,
          playerName: playerObj?.fullName ?? `Suplente #${jerseyNumber}`,
          position: playerObj?.position,
          isStarter: false,
        });
      });
    } else if (availablePlayers.length > 0) {
      // Fallback con jugadores de la división ordenados por número de camiseta
      availablePlayers.forEach((playerObj, index) => {
        const jerseyNumber = playerObj.jerseyNumber ?? (index + 1);
        if (!rosterMap.has(jerseyNumber) && jerseyNumber <= 23) {
          const isStarter = jerseyNumber <= 15;
          rosterMap.set(jerseyNumber, {
            playerId: playerObj.id ?? `player-${jerseyNumber}`,
            jerseyNumber,
            playerName: playerObj.fullName ?? (isStarter ? `Titular #${jerseyNumber}` : `Suplente #${jerseyNumber}`),
            position: playerObj.position,
            isStarter,
          });
        }
      });
    }

    // Asegurar las 23 plazas reglamentarias de rugby
    for (let num = 1; num <= 23; num++) {
      if (!rosterMap.has(num)) {
        const isStarter = num <= 15;
        const playerObj = availablePlayers.find(p => p.jerseyNumber === num);
        rosterMap.set(num, {
          playerId: playerObj?.id ?? `slot-${num}`,
          jerseyNumber: num,
          playerName: playerObj?.fullName ?? (isStarter ? `Titular #${num}` : `Suplente #${num}`),
          position: playerObj?.position,
          isStarter,
        });
      }
    }

    // Incluir camisetas adicionales de eventos si existieran
    const events = await liveCaptureDatabase.events.where('matchId').equals(matchId).toArray();
    for (const event of events) {
      const playerNum = event.attributes?.['playerNumber'];
      const num = typeof playerNum === 'number' ? playerNum : (playerNum ? Number(playerNum) : null);
      if (num && !isNaN(num) && !rosterMap.has(num)) {
        const playerObj = availablePlayers.find(p => p.jerseyNumber === num || p.id === event.playerId);
        const isStarter = num <= 15;
        rosterMap.set(num, {
          playerId: event.playerId ?? playerObj?.id ?? `event-player-${num}`,
          jerseyNumber: num,
          playerName: playerObj?.fullName ?? (isStarter ? `Titular #${num}` : `Suplente #${num}`),
          position: playerObj?.position,
          isStarter,
        });
      }
    }

    return Array.from(rosterMap.values()).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
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
      // 1. Actualizar estado local en Dexie para el 2° Tiempo (Minuto 40:00 acumulado)
      const currentState = await liveCaptureDatabase.states.get(id);
      await liveCaptureDatabase.states.put({
        matchId: id,
        gameClock: '40:00',
        period: 2,
        periodLabel: '2T',
        synchronized: true,
        clockPaused: false,
        isHalftime: false,
        pendingSelection: null,
        clockElapsedSeconds: Math.max(2400, currentState?.clockElapsedSeconds ?? 2400),
        savedAt: Date.now(),
        currentPossession: currentState?.currentPossession ?? 'OWN',
        scoreboard: {
          home: this.generalStats()?.ownScore ?? 0,
          away: this.generalStats()?.opponentScore ?? 0,
        },
      });

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
}
