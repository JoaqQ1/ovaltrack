import { MatchTimelineEventResponse } from '../../types/event.types';
import { HALF_DURATION_SECONDS } from '../../types/match.types';

export const RUGBY_HALF_TIME_MIN = 40;
export const RUGBY_FULL_TIME_MIN = 80;
export const EMPTY_TIME_PLACEHOLDER = '--:--:--';

/**
 * Resuelve el color de acento deportivo para una categoría o tipo de evento de rugby.
 */
export function resolveEventColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('try')) return '#2e7d32'; // Verde
  if (lower.includes('tackle fallado')) return '#2563eb'; // Azul medio (Punto 12)
  if (lower.includes('tackle')) return '#16324f'; // Azul marino oscuro
  if (lower.includes('penal') || lower.includes('infracción') || lower.includes('amarilla') || lower.includes('roja')) {
    return '#b42318'; // Rojo deportivo
  }
  if (lower.includes('line') || lower.includes('scrum') || lower.includes('turnover')) {
    return '#d96a0a'; // Naranja óxido
  }
  if (lower.includes('drop') || lower.includes('conversión')) {
    return '#7c3aed'; // Púrpura
  }
  return '#204b22'; // Salvia primario default
}

/**
 * Formatea segundos acumulados en cadena 'MM:SS'.
 */
export function formatTimeSeconds(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formatea segundos totales de hora absoluta en cadena 'HH:MM:SS' o 'MM:SS'.
 */
export function formatAbsoluteTime(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formatea una fecha ISO a hora local 'HH:mm:ss'.
 */
export function formatOnlyTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY_TIME_PLACEHOLDER;
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return EMPTY_TIME_PLACEHOLDER;
  }
}

/**
 * Estima la hora absoluta para un nuevo evento proyectando el desfase acumulado
 * de pausas del evento previo más cercano en el mismo período.
 */
export function estimateAbsoluteTime(
  rawEvents: MatchTimelineEventResponse[],
  newMatchTimeSeconds: number,
  period: 1 | 2
): number {
  // 1. Filtrar eventos del mismo período con hora absoluta válida
  const periodEvents = rawEvents
    .filter(e => (e.period ?? 1) === period && e.absoluteMatchTime != null)
    .sort((a, b) => (a.matchTime ?? 0) - (b.matchTime ?? 0));

  // 2. Buscar el evento anterior más cercano (matchTime <= newMatchTimeSeconds)
  const prevEvents = periodEvents.filter(e => (e.matchTime ?? 0) <= newMatchTimeSeconds);
  const prevEvent = prevEvents.length > 0 ? prevEvents[prevEvents.length - 1] : null;

  if (prevEvent && prevEvent.absoluteMatchTime != null) {
    const prevMatchTime = prevEvent.matchTime ?? 0;
    const pauseOffset = Math.max(0, prevEvent.absoluteMatchTime - prevMatchTime);
    let calculated = newMatchTimeSeconds + pauseOffset;

    // Si coincide exactamente el segundo de juego, sumar 2 segundos para desempatar la secuencia visual
    if (prevMatchTime === newMatchTimeSeconds) {
      calculated = Math.max(calculated, prevEvent.absoluteMatchTime + 2);
    }
    return calculated;
  }

  // 3. Fallback si no hay eventos previos en el período:
  if (period === 1) {
    return newMatchTimeSeconds;
  } else {
    // Si es período 2 y no hay eventos en 2T, anclarse al último evento del 1T
    const p1Events = rawEvents
      .filter(e => (e.period ?? 1) === 1 && e.absoluteMatchTime != null)
      .sort((a, b) => (a.absoluteMatchTime ?? 0) - (b.absoluteMatchTime ?? 0));
    const lastP1 = p1Events.length > 0 ? p1Events[p1Events.length - 1] : null;
    const baseP2 = lastP1?.absoluteMatchTime != null ? lastP1.absoluteMatchTime : HALF_DURATION_SECONDS;
    const elapsedInP2 = newMatchTimeSeconds >= HALF_DURATION_SECONDS
      ? (newMatchTimeSeconds - HALF_DURATION_SECONDS)
      : newMatchTimeSeconds;
    return baseP2 + elapsedInP2;
  }
}
