import { UUID } from '../../match/types/common.types';
import { PeriodStatisticDTO } from '../../match/statistics/types/statistic.types';

/** Un partido finalizado dentro del rango, con sus estadísticas de partido completo. */
export interface DivisionMatchStatistic {
  matchId: UUID;
  /** ISO local (LocalDateTime del backend). */
  date: string;
  opponentName: string | null;
  /** Mismo contrato que `GET /statistics/match/{id}`, con `period` en null (partido completo). */
  statistics: PeriodStatisticDTO;
}

/** Respuesta de `GET /statistics/division/{divisionId}?from=&to=`. */
export interface DivisionStatisticsResponse {
  divisionId: UUID;
  divisionName: string;
  from: string;
  to: string;
  matches: DivisionMatchStatistic[];
}

export type DivisionStatisticsErrorKind = 'forbidden' | 'not-found' | 'invalid-range' | 'generic';
