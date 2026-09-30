import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../services/match.service';
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

  readonly opponentPossessionPercentage = computed(() => {
    const own = this.generalStats()?.ownPossessionPercentage ?? 0;
    return Math.max(0, 100 - own);
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
        firstValueFrom(this.matchService.getSavedRoster(matchId)).catch(() => null),
        firstValueFrom(this.matchService.getAvailablePlayers(matchId)).catch(() => []),
      ]);
      savedRoster = rosterRes;
      availablePlayers = Array.isArray(playersRes) ? playersRes : [];
    } catch {
      // Offline fallback
    }

    const rosterMap = new Map<string, RosterPlayerInfo>();

    if (savedRoster && (savedRoster.startingPlayers.length > 0 || savedRoster.substitutePlayers.length > 0)) {
      // Titulares 1 al 15
      savedRoster.startingPlayers.forEach((playerId, index) => {
        if (!playerId) return;
        const playerObj = availablePlayers.find(p => p.id === playerId);
        rosterMap.set(playerId, {
          playerId,
          jerseyNumber: index + 1,
          playerName: playerObj?.fullName ?? `Titular #${index + 1}`,
          isStarter: true,
        });
      });

      // Suplentes 16 al 23
      savedRoster.substitutePlayers.forEach((playerId, index) => {
        if (!playerId) return;
        const playerObj = availablePlayers.find(p => p.id === playerId);
        rosterMap.set(playerId, {
          playerId,
          jerseyNumber: index + 16,
          playerName: playerObj?.fullName ?? `Suplente #${index + 16}`,
          isStarter: false,
        });
      });
    }

    // Incluir jugadores de eventos en caso de no estar en el roster guardado
    const events = await liveCaptureDatabase.events.where('matchId').equals(matchId).toArray();
    for (const event of events) {
      if (event.playerId && !rosterMap.has(event.playerId)) {
        const playerObj = availablePlayers.find(p => p.id === event.playerId);
        rosterMap.set(event.playerId, {
          playerId: event.playerId,
          jerseyNumber: playerObj?.jerseyNumber ?? (rosterMap.size + 1),
          playerName: playerObj?.fullName ?? `Jugador #${rosterMap.size + 1}`,
          isStarter: true,
        });
      }
    }

    return Array.from(rosterMap.values()).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
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
