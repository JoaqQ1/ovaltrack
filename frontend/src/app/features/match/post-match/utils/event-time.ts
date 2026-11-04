import { HALF_DURATION_SECONDS } from '../../types/match.types';

/**
 * Valida el tiempo de un evento tal como se carga en el formulario (minuto y segundo).
 * En el 2T se acepta el minuto del período (5) o el acumulado del partido (45).
 * Devuelve el mensaje a mostrar, o null si el tiempo es válido.
 */
export function validateEventTime(period: 1 | 2, minute: number | null | undefined, second: number | null | undefined): string | null {
  if (minute === null || minute === undefined || minute < 0) {
    return 'Ingresá un minuto válido';
  }
  if (period === 1 && minute > 40) {
    return `El 1° Tiempo no puede superar los 40 minutos. Si el evento ocurrió en el minuto ${minute} del partido, seleccioná el 2° Tiempo.`;
  }
  if (period === 2 && minute > 80) {
    return 'El 2° Tiempo no puede superar los 80 minutos de partido.';
  }
  const secVal = second ?? 0;
  if (secVal < 0 || secVal > 59) {
    return 'Los segundos deben estar entre 0 y 59';
  }
  return null;
}

/** Segundos acumulados de partido (`matchTime`): en el 2T un minuto menor a 40 se cuenta desde el 40'. */
export function toMatchTimeSeconds(period: 1 | 2, minute: number, second: number | null | undefined): number {
  const seconds = Math.floor(minute) * 60 + Math.floor(second ?? 0);
  if (period === 2 && minute * 60 < HALF_DURATION_SECONDS) {
    return HALF_DURATION_SECONDS + seconds;
  }
  return seconds;
}

/** Minuto acumulado y segundo de un `matchTime`, para precargar el formulario (52:10 en el 2T, no 12:10). */
export function fromMatchTimeSeconds(matchTime: number): { minute: number; second: number } {
  const total = Math.max(0, Math.floor(matchTime));
  return { minute: Math.floor(total / 60), second: total % 60 };
}
