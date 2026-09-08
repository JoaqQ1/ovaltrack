export type Posesion = 'propio' | 'neutro' | 'rival';

export type EventoVariante = 'success' | 'danger' | 'warning' | 'default';

export interface EventoCatalogo {
  id: string;
  nombre: string;
  contador?: number;
  variante?: EventoVariante;
}

export interface CategoriaEventos {
  nombre: string;
  eventos: EventoCatalogo[];
}

export interface HistorialItem {
  id?: string;
  minuto: string;
  descripcion: string;
}

export interface LiveCaptureBackendQuery {
  clubId: string;
  divisionId: string;
  matchId: string;
}

export interface LiveCaptureBackendEventType {
  id: string;
  name: string;
  groupName: string;
  category: 'attack' | 'defense' | 'possession' | 'set-piece' | 'neutral';
  affectsPossession?: boolean;
  isScoring?: boolean;
  points?: number;
  requiresPlayer?: boolean;
  active?: boolean;
}

export interface LiveCaptureBackendEvent {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  teamPossession: Posesion;
  matchTime: number;
  period: number;
  origin: 'live-capture' | 'manual' | 'import';
  points: number;
  attributes?: Record<string, unknown>;
  synchronizedAt?: string | null;
}

export interface LiveCaptureBackendState {
  teamLocal: string;
  teamVisitante: string;
  marcador: {
    local: number;
    visitante: number;
  };
  relojJuego: string;
  periodoLabel: string;
  relojPausado: boolean;
  posesionActual: Posesion;
  sincronizado: boolean;
  categorias: CategoriaEventos[];
  historial: HistorialItem[];
}

export interface LiveCaptureBackendResponse {
  query: LiveCaptureBackendQuery;
  state: LiveCaptureBackendState;
  recentEvents: LiveCaptureBackendEvent[];
  eventTypes: LiveCaptureBackendEventType[];
}
