import { ZONE_GRID_COLS, ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZonePeriod } from '../../types/zone.types';
import { ZONE_COLUMN_NAMES, ZONE_ROW_LETTERS, columnRangeLabel, zoneLabel } from './zone-grid';
import { MinuteRange, ZoneEvent, ZonePeriodFilter, eventsInRange, findGaps } from './zone-stats';

/** Largo del eje horizontal de la grilla de territorio: los 80 minutos del partido, con el 2T a continuación del 1T. */
export const TRACK_MINUTES = ZONE_HALF_MINUTES * 2;

/** Un bloque de esta duración o menor no entra con la etiqueta completa: muestra solo la letra del lateral. */
export const SHORT_BLOCK_MINUTES = 2;

type TimeRange = Pick<ZoneAssignmentResponse, 'startMinute' | 'endMinute'>;

export interface BlockLayout {
  /** Posición izquierda y ancho, en % del eje de 80 minutos. */
  left: number;
  width: number;
}

export function minuteToPercent(minute: number): number {
  return (minute / TRACK_MINUTES) * 100;
}

export function blockLayout(range: TimeRange): BlockLayout {
  return { left: minuteToPercent(range.startMinute), width: minuteToPercent(range.endMinute - range.startMinute) };
}

export function isShortBlock(range: TimeRange): boolean {
  return range.endMinute - range.startMinute <= SHORT_BLOCK_MINUTES;
}

/** Etiqueta del bloque: la celda completa (D5) o, si es muy corto, solo la letra del lateral (D). */
export function blockLabel(assignment: ZoneAssignmentResponse): string {
  return isShortBlock(assignment) ? ZONE_ROW_LETTERS[assignment.row - 1] : zoneLabel(assignment);
}

/** Una fila de la grilla de territorio = una franja de la cancha (columna 1–6). */
export interface TerritoryRow {
  col: number;
  name: string;
  /** Metros desde la línea de gol propia, o "in-goal". */
  range: string;
}

/** Filas de arriba hacia abajo: el in-goal rival primero (dirección de ataque) y el propio al final. */
export function territoryRows(): TerritoryRow[] {
  return Array.from({ length: ZONE_GRID_COLS }, (_, i) => ZONE_GRID_COLS - i).map(col => ({
    col,
    name: ZONE_COLUMN_NAMES[col - 1],
    range: columnRangeLabel(col) || 'in-goal'
  }));
}

/** Eventos con zona por franja (columna de la cancha), dentro del tiempo elegido. */
export function countByFranja(events: ZoneEvent[], filter: ZonePeriodFilter): Map<number, number> {
  const counts = new Map<number, number>();
  for (const event of events) {
    if (!event.zone || (filter !== 'ALL' && event.period !== filter)) continue;
    counts.set(event.zone.col, (counts.get(event.zone.col) ?? 0) + 1);
  }
  return counts;
}

/** Minuto (entero, 0–79) que corresponde a una posición horizontal dentro del eje de 80 minutos. */
export function minuteAtOffset(offsetX: number, trackWidth: number): number {
  if (!(trackWidth > 0)) return 0;
  const minute = Math.floor((offsetX / trackWidth) * TRACK_MINUTES);
  return Math.min(Math.max(minute, 0), TRACK_MINUTES - 1);
}

export type PeriodGap = MinuteRange & { period: ZonePeriod };

/** Todos los huecos sin zona, 1T primero, con minutos acumulados de partido. */
export function allGaps(assignments: ZoneAssignmentResponse[]): PeriodGap[] {
  return ([1, 2] as ZonePeriod[]).flatMap(period =>
    findGaps(assignments, period).map(gap => ({ period, start: gap.start, end: gap.end })));
}

/** Hueco que contiene el minuto (rango [inicio, fin)); null si ese minuto ya está dentro de un tramo. */
export function gapAtMinute(assignments: ZoneAssignmentResponse[], minute: number): PeriodGap | null {
  return allGaps(assignments).find(gap => minute >= gap.start && minute < gap.end) ?? null;
}

export interface GapWithEvents extends PeriodGap {
  /** Eventos del partido que caen en el hueco (hoy quedan sin zona). */
  eventCount: number;
}

export function gapsWithEventCount(assignments: ZoneAssignmentResponse[], events: ZoneEvent[]): GapWithEvents[] {
  return allGaps(assignments).map(gap => ({
    ...gap,
    eventCount: eventsInRange({ period: gap.period, startMinute: gap.start, endMinute: gap.end }, events).length
  }));
}

/** Con el filtro de tiempo en 1T o 2T, la otra mitad de la grilla se atenúa. */
export function isOutsidePeriodFilter(period: ZonePeriod, filter: ZonePeriodFilter): boolean {
  return filter !== 'ALL' && filter !== period;
}
