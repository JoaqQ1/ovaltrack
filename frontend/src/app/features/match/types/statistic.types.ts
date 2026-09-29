import { UUID } from './common.types';

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
