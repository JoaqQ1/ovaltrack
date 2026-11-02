export type ZonePeriod = 1 | 2;

/** Geometría fija de la cancha: 3 filas (ancho) x 6 columnas (ingoal, 22, mitad, mitad, 22, ingoal). */
export const ZONE_GRID_ROWS = 3;
export const ZONE_GRID_COLS = 6;
export const ZONE_HALF_MINUTES = 40;

/** Celda de la grilla indexada desde 1 (fila = ancho de la cancha, columna = largo). */
export interface ZoneCellRef {
  row: number;
  col: number;
}

export interface ZoneAssignmentRequest {
  row: number;
  col: number;
  period: ZonePeriod;
  startMinute: number;
  endMinute: number;
}

export interface ZoneAssignmentResponse extends ZoneAssignmentRequest {
  id: string;
  matchId: string;
}

export interface ZoneCellSummary {
  row: number;
  col: number;
  eventCount: number;
}

export interface ZoneSummary {
  cells: ZoneCellSummary[];
  unzonedEventCount: number;
}

export interface MatchZonesResponse {
  assignments: ZoneAssignmentResponse[];
  summary: ZoneSummary;
}
