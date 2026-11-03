import { UUID } from '../../types/common.types';
import { LiveStatView } from '../../types/event-type.types';

/** Respuesta de `GET /statistics/match/{id}`. */
export interface PeriodStatisticDTO {
  matchId: UUID;
  period: number;
  ownScore: number;
  opponentScore: number;
  ownTries: number;
  opponentTries: number;
  ownConversions: number;
  opponentConversions: number;
  ownPenalties: number;
  opponentPenalties: number;
  ownDropGoals: number;
  opponentDropGoals: number;
  ownTacklesCompleted: number;
  ownTacklesMissed: number;
  ownTackleEffectiveness: number;
  ownTurnoversWon: number;
  ownTurnoversLost: number;
  ownPenaltiesConceded: number;
  opponentPenaltiesConceded: number;
  ownYellowCards: number;
  opponentYellowCards: number;
  ownRedCards: number;
  opponentRedCards: number;
  scrumsTotal: number;
  lineoutsTotal: number;
  ownPossessionPercentage: number;
}

/**
 * Vista donde se muestran las estadísticas. `basic` e `intermediate` toman los tipos marcados en
 * `statView`; `full` (post-partido) muestra todos los tipos.
 */
export type StatView = LiveStatView | 'full';

export interface TeamValue {
  own: number;
  opponent: number;
}

/** `null` cuando no hay datos para calcular el valor (p. ej. un promedio sin muestras). */
export interface OptionalTeamValue {
  own: number | null;
  opponent: number | null;
}

export interface SelectOptionStat {
  value: string;
  label: string;
  count: TeamValue;
}

/** Distribución de un campo `select`: una entrada por opción del catálogo. */
export interface SelectFieldStat {
  kind: 'select';
  key: string;
  label: string;
  options: SelectOptionStat[];
  /** Eventos sin valor (o con un valor que ya no está en el catálogo). */
  pending: TeamValue;
}

export interface BooleanFieldStat {
  kind: 'boolean';
  key: string;
  label: string;
  trueLabel: string;
  falseLabel: string;
  yes: TeamValue;
  no: TeamValue;
}

export interface NumberFieldStat {
  kind: 'number';
  key: string;
  label: string;
  total: OptionalTeamValue;
  average: OptionalTeamValue;
}

export type FieldStat = SelectFieldStat | BooleanFieldStat | NumberFieldStat;

/** Estadísticas de un tipo de evento, derivadas solo de su definición en el catálogo. */
export interface EventTypeStat {
  eventTypeId: UUID;
  code: string;
  name: string;
  isScoring: boolean;
  /** Eventos registrados (para tipos que suman: intentos). */
  count: TeamValue;
  /** Tipos que suman: intentos que contaron. `null` en tipos que no suman. */
  made: TeamValue | null;
  /** Tipos que suman: puntos obtenidos. `null` en tipos que no suman. */
  points: TeamValue | null;
  /** El tipo tiene un campo con efecto `scoring`, así que `made` puede ser menor que `count`. */
  hasAttempts: boolean;
  fields: FieldStat[];
}

export interface EventTypeStatGroup {
  /** `groupName` del catálogo. */
  name: string;
  types: EventTypeStat[];
}

export type MetricFormat = 'int' | 'signed' | 'percent';
export type MetricStatusType = 'success' | 'warning' | 'danger' | 'neutral';

export interface MetricStatus {
  label: string;
  type: MetricStatusType;
}

/** Métrica que combina varios tipos de evento (ver `derived-metrics.ts`). */
export interface DerivedMetric {
  id: string;
  label: string;
  format: MetricFormat;
  value: OptionalTeamValue;
  status: MetricStatus | null;
}

export interface MatchStatistics {
  view: StatView;
  /** Marcador con todos los tipos que suman, aunque no estén en la vista. */
  score: TeamValue;
  ownPossessionPercentage: number;
  groups: EventTypeStatGroup[];
  derived: DerivedMetric[];
}

/** Columna de la planilla de jugadores: un tipo de la vista que requiere jugador. */
export interface PlayerStatColumn {
  eventTypeId: UUID;
  code: string;
  label: string;
  groupName: string;
  isScoring: boolean;
  hasAttempts: boolean;
}

export interface PlayerEventTypeValue {
  count: number;
  /** Solo en tipos que suman. */
  made: number | null;
}

export interface PlayerStatistic {
  playerId: string;
  jerseyNumber: number;
  playerName: string;
  position?: string;
  isStarter: boolean;
  minutesPlayed: number;
  totalPoints: number;
  /** Valores por `eventTypeId` de cada columna. */
  values: Record<string, PlayerEventTypeValue>;
  hasActivity: boolean;
}

export interface PlayerStatistics {
  columns: PlayerStatColumn[];
  players: PlayerStatistic[];
}
