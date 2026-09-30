import { UUID } from './common.types';

/** Respuesta de un partido según el contrato consumido por la interfaz. */
export interface Match {
  id: string;
  date: string;
  divisionId: UUID;
  opponent: string;
  status: MatchStatus;
  currentPeriod?: number;
  score?: { home: number; away: number };
}

/** Respuesta JSON de un partido según MatchResponseDTO. */
export interface BackendMatchResponse {
  id: UUID;
  date: string | null;
  divisionId: UUID;
  opponent: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'HALFTIME' | 'FINISHED' | 'CANCELLED';
  currentPeriod?: number;
}

/** Datos mínimos necesarios para dar de alta un partido nuevo. */
export interface NewMatchDraft {
  date: string;
  opponent: string;
}

/** Estados posibles de un partido en el listado. */
export type MatchStatus = 'not_started' | 'in_progress' | 'halftime' | 'finished' | 'cancelled';

/** Filtro del listado: todos los estados más la opción "ver todos". */
export type MatchFilter = MatchStatus | 'all';

/** Filtros disponibles, en el orden en que se renderizan en el control segmentado. */
export const MATCH_FILTERS: readonly MatchFilter[] = ['all', 'not_started', 'in_progress', 'halftime', 'finished', 'cancelled'] as const;

/** Etiquetas legibles para cada estado/filtro. */
export const MATCH_STATUS_LABELS: Record<MatchFilter, string> = {
  all: 'Todos',
  not_started: 'No iniciado',
  in_progress: 'En progreso',
  halftime: 'Entretiempo',
  finished: 'Finalizado',
  cancelled: 'Cancelados',
};