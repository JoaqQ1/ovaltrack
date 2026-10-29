import { ZONE_GRID_COLS, ZONE_GRID_ROWS, ZONE_HALF_MINUTES, ZonePeriod } from '../../types/zone.types';

export interface ZoneFormValues {
  period: ZonePeriod;
  startMinute: number | null;
  endMinute: number | null;
  row: number | null;
  col: number | null;
}

/** Rango de minutos de partido que cubre cada tiempo (1T: 0–40, 2T: 40–80). */
export function periodBounds(period: ZonePeriod): { start: number; end: number } {
  return { start: (period - 1) * ZONE_HALF_MINUTES, end: period * ZONE_HALF_MINUTES };
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

  const bounds = periodBounds(period);
  if (startMinute < bounds.start || endMinute > bounds.end) {
    return `El ${period}° tiempo va del minuto ${bounds.start} al ${bounds.end}`;
  }
  return null;
}
