export type Possession = 'own' | 'neutral' | 'opponent';

export type EventVariant = 'success' | 'danger' | 'warning' | 'default';

export interface EventCategoryGroup {
  name: string;
  events: LiveCaptureBackendEventType[];
}

export interface HistoryItem {
  id?: string;
  minute: string;
  description: string;
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
  eventType: string;
  match:string;
  player: string | null;
  teamPossession: Possession;
  matchTime: number;
  realTime: number;
  period: number;
  origin: 'live-capture' | 'manual' | 'import';
  attributes?: Record<string, unknown>;
  createdAt: string;
  synchronizedAt?: string | null;
}

export interface LiveCaptureBackendState {
  homeTeam: string;
  awayTeam: string;
  scoreboard: {
    home: number;
    away: number;
  };
  gameClock: string;
  periodLabel: string;
  clockPaused: boolean;
  currentPossession: Possession;
  synchronized: boolean;
  history: HistoryItem[];
}

export interface LiveCaptureBackendResponse {
  query: LiveCaptureBackendQuery;
  state: LiveCaptureBackendState;
  recentEvents: LiveCaptureBackendEvent[];
  eventTypes: LiveCaptureBackendEventType[];
}
