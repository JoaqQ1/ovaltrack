import { Match } from '../../match/types/match.types';
import { shortTeamName } from '../../match/post-match/utils/zone-grid';
import { parseWallClock } from './match-time';

export type FormResult = 'win' | 'draw' | 'loss';

export interface FormEntry {
  matchId: string;
  result: FormResult;
  /** "24-17": marcador propio primero. */
  score: string;
  opponent: string;
}

export interface FormRecord {
  wins: number;
  draws: number;
  losses: number;
  /** Tantos a favor menos tantos en contra de toda la temporada. */
  diff: number;
  /** Últimos partidos jugados, del más viejo al más reciente. */
  last: FormEntry[];
}

export const FORM_LAST_COUNT = 5;

export type FormMatch = Pick<Match, 'id' | 'date' | 'status' | 'homeScore' | 'awayScore' | 'opponent'>;

export function resultOf(ownScore: number, opponentScore: number): FormResult {
  return ownScore > opponentScore ? 'win' : ownScore < opponentScore ? 'loss' : 'draw';
}

/** Partidos FINISHED de la temporada (año de `now`) en orden cronológico; el club siempre es local: `homeScore` es el propio. */
export function finishedOfSeason<T extends FormMatch>(matches: readonly T[], now: Date): T[] {
  return matches
    .map(match => ({ match, start: parseWallClock(match.date) }))
    .filter((entry): entry is { match: T; start: Date } =>
      entry.start !== null && entry.match.status === 'finished' && entry.start.getFullYear() === now.getFullYear())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(entry => entry.match);
}

/** Récord G-E-P, diferencia y últimos 5; `null` si todavía no se jugó ningún partido de la temporada. */
export function formRecord(matches: readonly FormMatch[], now: Date): FormRecord | null {
  const finished = finishedOfSeason(matches, now);
  if (finished.length === 0) return null;
  const results = finished.map(match => resultOf(match.homeScore, match.awayScore));
  return {
    wins: results.filter(result => result === 'win').length,
    draws: results.filter(result => result === 'draw').length,
    losses: results.filter(result => result === 'loss').length,
    diff: finished.reduce((sum, match) => sum + match.homeScore - match.awayScore, 0),
    last: finished.slice(-FORM_LAST_COUNT).map(match => ({
      matchId: match.id,
      result: resultOf(match.homeScore, match.awayScore),
      score: `${match.homeScore}-${match.awayScore}`,
      opponent: shortTeamName(match.opponent.alias || match.opponent.name)
    }))
  };
}
