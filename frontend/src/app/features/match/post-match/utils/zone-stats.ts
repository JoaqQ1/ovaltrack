import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZonePeriod } from '../../types/zone.types';
import { zoneLabel } from './zone-grid';

export interface MinuteRange {
  start: number;
  end: number;
}

type RangeLike = Pick<ZoneAssignmentResponse, 'period' | 'startMinute' | 'endMinute'>;

/** Minutos de partido que cubre cada tiempo (1T: 0–40, 2T: 40–80). */
export function periodRange(period: ZonePeriod): MinuteRange {
  return { start: (period - 1) * ZONE_HALF_MINUTES, end: period * ZONE_HALF_MINUTES };
}

/** Tramos libres de un tiempo, ordenados. Los rangos son semiabiertos: [inicio, fin). */
export function findGaps(assignments: RangeLike[], period: ZonePeriod): MinuteRange[] {
  const bounds = periodRange(period);
  const taken = assignments
    .filter(a => a.period === period)
    .map(a => ({ start: a.startMinute, end: a.endMinute }))
    .sort((a, b) => a.start - b.start);

  const gaps: MinuteRange[] = [];
  let cursor = bounds.start;
  for (const range of taken) {
    if (range.start > cursor) gaps.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < bounds.end) gaps.push({ start: cursor, end: bounds.end });
  return gaps;
}

/**
 * Rango sugerido para el próximo tramo: empieza en el hueco que arranca en `afterMinute` (o en el primero
 * libre) y dura como mucho `length` minutos. Devuelve null si el tiempo está completamente cubierto.
 */
export function suggestRange(assignments: RangeLike[], period: ZonePeriod, afterMinute?: number, length = 5): MinuteRange | null {
  const gaps = findGaps(assignments, period);
  if (gaps.length === 0) return null;

  const gap = (afterMinute !== undefined ? gaps.find(g => g.start >= afterMinute) : undefined) ?? gaps[0];
  return { start: gap.start, end: Math.min(gap.start + length, gap.end) };
}

/** Primer tramo existente que se pisa con el rango pedido (misma regla [inicio, fin) que el backend). */
export function findOverlap<T extends RangeLike & { id: string }>(
  request: RangeLike,
  assignments: T[],
  ignoredId?: string | null
): T | null {
  return assignments.find(other =>
    other.id !== ignoredId &&
    other.period === request.period &&
    request.startMinute < other.endMinute &&
    other.startMinute < request.endMinute
  ) ?? null;
}

/** Descripción corta de un tramo para mensajes, ej. "1T 10'–25' (C3)". */
export function describeSegment(a: ZoneAssignmentResponse): string {
  return `${a.period}T ${a.startMinute}'–${a.endMinute}' (${zoneLabel(a)})`;
}
