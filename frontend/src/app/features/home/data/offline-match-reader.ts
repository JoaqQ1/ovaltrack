import { LocalMatchEvent } from '../../match/types/event.types';
import { Match } from '../../match/types/match.types';

/** Período y reloj que la captura dejó guardados en este dispositivo. */
export interface CaptureProgress {
  periodLabel: string;
  gameClock: string;
  homeScore: number | null;
  awayScore: number | null;
}

/**
 * Lo único que el Inicio puede leer del almacenamiento offline. Es un límite de seguridad de datos:
 * `LocalDatabaseService` también escribe, y el Inicio nunca debe poder hacerlo (ISP).
 */
export abstract class OfflineMatchReader {
  /** Hay partido, nómina, tipos de evento y jugadores de la división para capturar sin señal. */
  abstract isReadyOffline(match: Pick<Match, 'id' | 'divisionId'>): Promise<boolean>;
  /** Últimos `limit` eventos activos del partido, el más reciente primero. */
  abstract recentEvents(matchId: string, limit: number): Promise<LocalMatchEvent[]>;
  /** Período y reloj guardados; `null` si este dispositivo nunca capturó el partido. */
  abstract captureProgress(matchId: string): Promise<CaptureProgress | null>;
  /** Nombre de cada tipo de evento por id, para rotular los últimos eventos; vacío si no hay catálogo guardado. */
  abstract eventTypeNames(): Promise<Record<string, string>>;
}
