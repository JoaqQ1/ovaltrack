import { ZONE_GRID_COLS, ZONE_GRID_ROWS, ZONE_HALF_MINUTES, ZonePeriod } from '../../types/zone.types';
import { periodRange } from './zone-stats';

export const HALFTIME_SPLIT_MESSAGE =
  'El rango cruza el entretiempo (minuto 40). Partilo en dos tramos: uno hasta el 40′ y otro desde el 40′.';

export interface ZoneFormValues {
  period: ZonePeriod;
  startMinute: number | null;
  endMinute: number | null;
  row: number | null;
  col: number | null;
}

/**
 * Espejo de las reglas del backend para dar feedback inmediato. Devuelve el mensaje del primer
 * error o null si el formulario es válido. El backend sigue siendo la fuente de verdad.
 */
export function validateZoneForm(values: ZoneFormValues): string | null {
  const { period, startMinute, endMinute, row, col } = values;

  if (row === null || col === null) {
    return 'Elegí una celda de la cancha';
  }
  if (row < 1 || row > ZONE_GRID_ROWS || col < 1 || col > ZONE_GRID_COLS) {
    return `La celda debe estar dentro de la grilla de ${ZONE_GRID_ROWS}x${ZONE_GRID_COLS}`;
  }
  if (startMinute === null || endMinute === null || !Number.isInteger(startMinute) || !Number.isInteger(endMinute)) {
    return 'Ingresá minutos enteros de inicio y fin';
  }
  if (startMinute >= endMinute) {
    return 'El minuto de inicio debe ser menor al minuto de fin';
  }

  const bounds = periodRange(period);
  if (startMinute < bounds.start || endMinute > bounds.end) {
    return `El ${period}° tiempo va del minuto ${bounds.start} al ${bounds.end}`;
  }
  return null;
}

/** Un rango cruza el entretiempo cuando empieza en el 1T y termina después del minuto 40. */
export function rangeCrossesHalftime(startMinute: number, endMinute: number): boolean {
  return startMinute < ZONE_HALF_MINUTES && endMinute > ZONE_HALF_MINUTES;
}

/**
 * Tiempo del tramo según sus minutos acumulados (0–80): desde el minuto 40 es 2T, antes es 1T.
 * Null si el rango no está completo, no es entero, no avanza o cruza el entretiempo.
 */
export function deduceZonePeriod(startMinute: number | null, endMinute: number | null): ZonePeriod | null {
  if (startMinute === null || endMinute === null || !Number.isInteger(startMinute) || !Number.isInteger(endMinute)) return null;
  if (startMinute >= endMinute || rangeCrossesHalftime(startMinute, endMinute)) return null;
  return startMinute >= ZONE_HALF_MINUTES ? 2 : 1;
}
