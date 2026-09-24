import { UUID } from './common.types';

export type { UUID } from './common.types';

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

/** Respuesta JSON de un tipo de evento persistido en event_types. */
export interface BackendEventTypeResponse {
  id: UUID;
  name: string;
  groupName: string | null;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | null;
  affectsPossession: boolean | null;
  isScoring: boolean | null;
  points: number | null;
  requiresPlayer: boolean | null;
  templateEventFields: Record<string, unknown> | null;
  createdAt: string;
  active: boolean | null;
}

/** Respuesta JSON de un evento persistido en events. */
export interface BackendEventResponse {
  id: UUID;
  eventTypeId: UUID;
  matchId: UUID;
  playerId: UUID | null;
  teamPossession: Possession;
  matchTime: number | null;
  realTime: string | null;
  period: number | null;
  origin: string | null;
  attributes: Record<string, unknown> | null;
  createdAt: string;
  synchronizedAt: string | null;
}

/** Payload enviado al backend para crear un evento nuevo. */
export interface BackendEventCreationRequest {
  eventTypeId: UUID;
  matchId: UUID;
  playerId?: UUID | null;
  teamPossession?: Possession | null;
  matchTime?: number | null;
  realTime?: string | null;
  period?: number | null;
  origin?: string | null;
  attributes?: Record<string, unknown>;
}

/**
 * Tipo de evento listo para renderizar en la pantalla.
 * Parte del DTO del backend, pero completa sus valores nullable y conserva
 * las categorías adicionales que sólo existen en la presentación visual.
 */
export type LiveCaptureEventType = Omit<BackendEventTypeResponse,
  'groupName' | 'category' | 'affectsPossession' | 'isScoring' | 'points' | 'requiresPlayer' | 'active'
> & {
  groupName: string;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | 'POSSESSION' | 'SET_PIECE';
  affectsPossession: boolean;
  isScoring: boolean;
  points: number;
  requiresPlayer: boolean;
  active: boolean;
};

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
  currentPossession: Possession;
  synchronized: boolean;
  history: HistoryItem[];
}

export interface LiveCapturePersistedState {
  matchId: UUID;
  gameClock: string;
  period: number;
  periodLabel: string;
  synchronized: boolean;
  clockPaused: boolean;
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

/** Evento local con la misma forma que EventResponseDTO del backend. */
export interface LocalMatchEvent extends BackendEventResponse {
  /** Secuencia local para conservar el orden de creación antes de sincronizar. */
  localSequence: number;
}

/** Modelo compuesto usado actualmente por la pantalla para inicializar su estado.
 * No es todavía una respuesta de un endpoint único del backend.
 */
export interface LiveCaptureBootstrap {
  query: LiveCaptureQuery;
  state: LiveCaptureState;
  recentEvents: LocalMatchEvent[];
  eventTypes: LiveCaptureEventType[];
  persistedState?: LiveCapturePersistedState;
}
