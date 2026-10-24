import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  KickingStat,
  MatchResult,
  PlayerCountStat,
  PlayerKpi,
  PlayerMatchHistory,
  PlayerProfile,
  PlayerRoleFilter,
} from './types/player-statistics.types';

/** Mockup: datos de ejemplo hasta conectar el endpoint de estadísticas del jugador. */
const MOCK_HISTORY: PlayerMatchHistory[] = [
  { matchId: 'm1', date: '2026-03-15', opponent: 'Los Tilos', result: 'win', ownScore: 27, opponentScore: 12, isStarter: true, minutesPlayed: 80, totalPoints: 12, tries: 1, conversionsMade: 2, conversionAttempts: 3, penaltyKicksMade: 1, penaltyKickAttempts: 1, yellowCards: 0, redCards: 0 },
  { matchId: 'm2', date: '2026-03-22', opponent: 'Pucará', result: 'loss', ownScore: 14, opponentScore: 21, isStarter: true, minutesPlayed: 80, totalPoints: 4, tries: 0, conversionsMade: 2, conversionAttempts: 2, penaltyKicksMade: 0, penaltyKickAttempts: 1, yellowCards: 0, redCards: 0 },
  { matchId: 'm3', date: '2026-03-29', opponent: 'CASI', result: 'win', ownScore: 31, opponentScore: 17, isStarter: true, minutesPlayed: 72, totalPoints: 11, tries: 1, conversionsMade: 3, conversionAttempts: 4, penaltyKicksMade: 0, penaltyKickAttempts: 0, yellowCards: 0, redCards: 0 },
  { matchId: 'm4', date: '2026-04-05', opponent: 'Regatas', result: 'draw', ownScore: 18, opponentScore: 18, isStarter: false, minutesPlayed: 30, totalPoints: 3, tries: 0, conversionsMade: 0, conversionAttempts: 0, penaltyKicksMade: 1, penaltyKickAttempts: 2, yellowCards: 0, redCards: 0 },
  { matchId: 'm5', date: '2026-04-12', opponent: 'Hindú', result: 'loss', ownScore: 10, opponentScore: 24, isStarter: true, minutesPlayed: 80, totalPoints: 5, tries: 1, conversionsMade: 0, conversionAttempts: 1, penaltyKicksMade: 0, penaltyKickAttempts: 1, yellowCards: 1, redCards: 0 },
  { matchId: 'm6', date: '2026-04-19', opponent: 'Newman', result: 'win', ownScore: 22, opponentScore: 15, isStarter: true, minutesPlayed: 80, totalPoints: 10, tries: 0, conversionsMade: 2, conversionAttempts: 2, penaltyKicksMade: 2, penaltyKickAttempts: 3, yellowCards: 0, redCards: 0 },
  { matchId: 'm7', date: '2026-04-26', opponent: 'Belgrano', result: 'win', ownScore: 35, opponentScore: 7, isStarter: true, minutesPlayed: 65, totalPoints: 9, tries: 1, conversionsMade: 2, conversionAttempts: 4, penaltyKicksMade: 0, penaltyKickAttempts: 0, yellowCards: 0, redCards: 0 },
  { matchId: 'm8', date: '2026-05-03', opponent: 'SIC', result: 'loss', ownScore: 12, opponentScore: 19, isStarter: false, minutesPlayed: 25, totalPoints: 2, tries: 0, conversionsMade: 1, conversionAttempts: 1, penaltyKicksMade: 0, penaltyKickAttempts: 0, yellowCards: 0, redCards: 0 },
];

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
  readonly resultLabels = RESULT_LABELS;
  readonly roleFilterLabels = ROLE_FILTER_LABELS;
  readonly roleFilters: readonly PlayerRoleFilter[] = ['all', 'starter', 'substitute'];
  readonly seasons: readonly string[] = ['2026', '2025'];

  readonly profile = signal<PlayerProfile>({
    fullName: 'Tomás Herrera',
    initials: 'TH',
    jerseyNumber: 10,
    position: 'Apertura',
    clubName: 'Club Atlético San Martín',
    divisionName: 'M19',
  });

  readonly history = signal<PlayerMatchHistory[]>(MOCK_HISTORY);
  readonly selectedSeason = signal('2026');
  readonly roleFilter = signal<PlayerRoleFilter>('all');

  readonly kicking = signal<KickingStat[]>([
    { label: 'Conversiones', made: 18, attempts: 24 },
    { label: 'Penales a palos', made: 9, attempts: 13 },
  ]);

  readonly playStats = signal<PlayerCountStat[]>([
    { label: 'Pases', value: 212 },
    { label: 'Offloads', value: 19 },
    { label: 'Pases malos', value: 11 },
    { label: 'Patadas a touch', value: 27 },
    { label: 'Salidas', value: 14 },
  ]);

  readonly disciplineStats = signal<PlayerCountStat[]>([
    { label: 'Penales cometidos', value: 8 },
    { label: 'Amarillas', value: 1, tone: 'warning' },
    { label: 'Rojas', value: 0, tone: 'error' },
  ]);

  readonly kpis = computed<PlayerKpi[]>(() => {
    const matches = this.history();
    const starters = matches.filter(m => m.isStarter).length;
    const minutes = matches.reduce((sum, m) => sum + m.minutesPlayed, 0);
    const points = matches.reduce((sum, m) => sum + m.totalPoints, 0);
    const tries = matches.reduce((sum, m) => sum + m.tries, 0);
    const count = (result: MatchResult) => matches.filter(m => m.result === result).length;
    const made = this.kicking().reduce((sum, k) => sum + k.made, 0);
    const attempts = this.kicking().reduce((sum, k) => sum + k.attempts, 0);

    return [
      { label: 'Partidos', value: `${matches.length}`, detail: `${starters} titular · ${matches.length - starters} suplente` },
      { label: 'Minutos', value: `${minutes}`, detail: `${this.average(minutes, matches.length)} min por partido` },
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
    this.selectedSeason.set(season);
  }

  percentage(made: number, attempts: number): number {
    return attempts === 0 ? 0 : Math.round((made / attempts) * 100);
  }

  private average(total: number, count: number): string {
    return count === 0 ? '0' : (total / count).toFixed(1).replace(/\.0$/, '');
  }
}
