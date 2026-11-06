import { MatchTimelineEventResponse } from '../../match/types/event.types';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse } from '../../match/types/zone.types';
import { coverageMinutes } from '../../match/post-match/utils/zone-stats';

export type CoverageEvent = Pick<MatchTimelineEventResponse, 'playerId' | 'teamPossession'>;

export interface AnalysisCoverage {
  totalEvents: number;
  /** Jugadas propias o neutrales sin jugador asignado. */
  withoutPlayer: number;
  /** 0–100, redondeado; un partido sin eventos cuenta como 100. */
  percent: number;
}

/**
 * Misma regla que `MatchReviewStore`: una jugada está "sin jugador" si no tiene `playerId`
 * y no es del rival (`OPPONENT` nunca lleva jugador del plantel).
 */
export function analysisCoverage(events: readonly CoverageEvent[]): AnalysisCoverage {
  const totalEvents = events.length;
  const withoutPlayer = events.filter(event => !event.playerId?.trim() && event.teamPossession !== 'OPPONENT').length;
  const percent = totalEvents > 0 ? Math.round(((totalEvents - withoutPlayer) / totalEvents) * 100) : 100;
  return { totalEvents, withoutPlayer, percent };
}

/** Minutos del partido (de 80) que todavía no tienen un tramo de zona asignado. */
export function minutesWithoutZone(assignments: readonly Pick<ZoneAssignmentResponse, 'period' | 'startMinute' | 'endMinute'>[]): number {
  const covered = coverageMinutes([...assignments], 1) + coverageMinutes([...assignments], 2);
  return ZONE_HALF_MINUTES * 2 - covered;
}
