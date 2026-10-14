import { UUID } from './common.types';
import { LiveCaptureEventType } from './event-type.types';
import { BackendEventResponse, LocalMatchEvent } from './event.types';
import { BackendEventTypeResponse } from './event-type.types';
import { Match } from './match.types';
import { AvailablePlayer } from './roster.types';

export type { UUID } from './common.types';
export type { LiveCaptureEventType, BackendEventTypeResponse } from './event-type.types';
export type { BackendEventResponse, LocalMatchEvent } from './event.types';

/** Valores exactos del enum EventPossession del backend. */
export type Possession = 'OWN' | 'NEUTRAL' | 'OPPONENT';

/** Variante visual usada para pintar un evento en la interfaz. */
export type EventVariant = 'success' | 'danger' | 'warning' | 'default';

/** Grupo visual de eventos para mostrar el catálogo organizado por secciones. */
export interface EventCategoryGroup {
  name: string;
  events: LiveCaptureEventType[];
}

/** Entrada legible del historial local de la pantalla de captura. */
export interface HistoryItem {
  id: UUID;
  minute: string;
  description: string;
}

/** Identificadores necesarios para consultar datos relacionados con un partido. */
export interface LiveCaptureQuery {
  matchId: UUID;
  clubId?: UUID;
  divisionId?: UUID;
}

export interface LiveCaptureBootstrapResponse {
  match: Match;
  events: BackendEventResponse[];
  eventTypes: BackendEventTypeResponse[];
}

/** Estado calculado o compuesto que necesita la pantalla de captura en vivo. */
export interface LiveCaptureState {
  homeTeam: string;
  awayTeam: string;
  scoreboard: {
    home: number;
    away: number;
  };
  gameClock: string;
  period: number;
  periodLabel: string;
  clockPaused: boolean;
  clockUpdatedAt?: string | null;
  currentPossession: Possession;
  synchronized: boolean;
  isHalftime?: boolean;
  history: HistoryItem[];
}

export interface LiveCapturePersistedState {
  matchId: UUID;
  isStarted: boolean;
  gameClock: string;
  period: number;
  periodLabel: string;
  synchronized: boolean;
  clockPaused: boolean;
  isHalftime?: boolean;
  pendingSelection: {
    event: LiveCaptureEventType;
    eventId: string;
    homeEnabled: boolean;
    awayEnabled: boolean;
  } | null;
  clockElapsedSeconds: number;
  savedAt: number;
  currentPossession?: Possession;
  scoreboard?: {
    home: number;
    away: number;
  };
}

/** Modelo compuesto usado actualmente por la pantalla para inicializar su estado.
 * No es todavía una respuesta de un endpoint único del backend.
 */
export interface LiveCaptureBootstrap {
  query: LiveCaptureQuery;
  match: Match;
  state: LiveCaptureState;
  recentEvents: LocalMatchEvent[];
  eventTypes: LiveCaptureEventType[];
  rosterPlayers: AvailablePlayer[];
  persistedState?: LiveCapturePersistedState;
}
