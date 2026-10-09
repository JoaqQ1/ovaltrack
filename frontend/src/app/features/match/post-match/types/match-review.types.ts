import { Possession } from '../../types/live-capture.types';

export type ReviewPeriodFilter = 'ALL' | 1 | 2;

export interface ReviewFilters {
  period: ReviewPeriodFilter;
  team: 'ALL' | 'OWN' | 'OPPONENT';
  onlyUnassigned: boolean;
  searchTerm: string;
  hiddenLaneIds: string[];
}

export interface ReviewEventViewModel {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  color: string;
  period: number;
  matchTime: number; // En segundos acumulados
  minute: number; // Minutos reglamentarios (matchTime / 60)
  pct: number; // Posición porcentual horizontal (0 a 100%)
  matchTimeFormatted: string; // Formato "MM:SS"
  realTime: string;
  realTimeFormatted: string; // Formato "HH:mm:ss"
  playerId: string | null;
  playerName: string;
  playerJerseyNumber: number | null;
  hasPlayer: boolean;
  teamPossession: Possession;
  isDimmed: boolean; // True si queda fuera de los filtros activos (para el gráfico)
}

export interface ReviewTimelineLane {
  eventTypeId: string;
  eventName: string;
  color: string;
  totalCount: number;
  hidden: boolean;
  occurrences: ReviewEventViewModel[];
}

export interface ReviewKpis {
  totalEvents: number;
  unassignedEvents: number;
  coveragePercentage: number;
  startTimeFormatted: string;
}
