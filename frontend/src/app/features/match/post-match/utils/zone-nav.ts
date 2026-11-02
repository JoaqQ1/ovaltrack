import { ZONE_GRID_COLS, ZoneAssignmentResponse, ZonePeriod } from '../../types/zone.types';
import { allGaps } from './zone-track-layout';

/** Lugar de una fila de la grilla al que se puede llegar con el teclado: un tramo de esa franja o un hueco sin zona. */
export type NavStop =
  | { kind: 'block'; start: number; end: number; assignment: ZoneAssignmentResponse }
  | { kind: 'gap'; start: number; end: number; period: ZonePeriod };

/**
 * Paradas de la fila de una franja, en orden de tiempo: sus tramos y los huecos. El tiempo que ocupa un tramo de otra
 * franja no es parada: no hay nada que abrir ni completar ahí.
 */
export function rowStops(assignments: ZoneAssignmentResponse[], col: number): NavStop[] {
  const blocks = assignments
    .filter(assignment => assignment.col === col)
    .map<NavStop>(assignment => ({ kind: 'block', start: assignment.startMinute, end: assignment.endMinute, assignment }));
  const gaps = allGaps(assignments).map<NavStop>(gap => ({ kind: 'gap', start: gap.start, end: gap.end, period: gap.period }));
  return [...blocks, ...gaps].sort((a, b) => a.start - b.start);
}

/** Parada que contiene el minuto (rango [inicio, fin)); null si ese minuto es de un tramo de otra franja. */
export function stopAt(stops: NavStop[], minute: number): NavStop | null {
  return stops.find(stop => minute >= stop.start && minute < stop.end) ?? null;
}

/**
 * Minuto al que lleva ← (-1) o → (+1). Dentro de un hueco avanza de a un minuto; desde un tramo, o al salir de un
 * hueco, salta a la parada vecina (a su inicio al ir hacia adelante; al ir hacia atrás, a su último minuto si es un
 * hueco o a su inicio si es un tramo). En el extremo de la fila no se mueve.
 */
export function stepMinute(stops: NavStop[], minute: number, direction: 1 | -1): number {
  const current = stopAt(stops, minute);
  if (current?.kind === 'gap') {
    const next = minute + direction;
    if (next >= current.start && next < current.end) return next;
  }

  if (direction > 0) {
    const edge = current ? current.end : minute + 1;
    return stops.find(stop => stop.start >= edge)?.start ?? minute;
  }

  const edge = current ? current.start : minute;
  const target = [...stops].reverse().find(stop => stop.end <= edge);
  if (!target) return minute;
  return target.kind === 'gap' ? target.end - 1 : target.start;
}

/** Franja que sigue al subir (+1: hacia el in-goal rival, arriba en la grilla) o bajar (-1); no pasa de los extremos. */
export function stepRow(col: number, direction: 1 | -1): number {
  return Math.min(Math.max(col + direction, 1), ZONE_GRID_COLS);
}
