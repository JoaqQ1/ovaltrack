/** Resultado de un partido desde la perspectiva del club del jugador. */
export type MatchResult = 'win' | 'loss' | 'draw';

/** Rol del jugador en el plantel del partido. */
export type MatchPlayerRole = 'TITULAR' | 'SUPLENTE';

/** Respuesta de `GET /matches/me`: partido finalizado en el que el jugador estuvo en el plantel. */
export interface PlayerMatchDTO {
  matchId: string;
  date: string;
  opponentName: string;
  divisionName: string;
  /** El club siempre es local: `homeScore` es el marcador propio. */
  homeScore: number;
  awayScore: number;
  role: MatchPlayerRole;
  /** Número de slot en la planilla (titulares 1-15, suplentes 16-23). */
  slotNumber: number | null;
}

/** Filtro del historial según el rol del jugador en el partido. */
export type PlayerRoleFilter = 'all' | 'starter' | 'substitute';

/** Perfil resumido del jugador autenticado. */
export interface PlayerProfile {
  fullName: string;
  initials: string;
  jerseyNumber: number;
  position: string;
  clubName: string;
  divisionName: string;
}

/** Indicador destacado de la temporada. */
export interface PlayerKpi {
  label: string;
  value: string;
  detail: string;
}

/** Intentos y aciertos de pateo a palos. */
export interface KickingStat {
  label: string;
  made: number;
  attempts: number;
}

/** Métrica simple de juego o disciplina. */
export interface PlayerCountStat {
  label: string;
  value: number;
  tone?: 'warning' | 'error';
}

/** Fila del historial de partidos jugados por el jugador. */
export interface PlayerMatchHistory {
  matchId: string;
  date: string;
  opponent: string;
  result: MatchResult;
  ownScore: number;
  opponentScore: number;
  isStarter: boolean;
  minutesPlayed: number;
  totalPoints: number;
  tries: number;
  conversionsMade: number;
  conversionAttempts: number;
  penaltyKicksMade: number;
  penaltyKickAttempts: number;
  yellowCards: number;
  redCards: number;
}
