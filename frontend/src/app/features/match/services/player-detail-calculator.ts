import { LiveCaptureEventType } from "../types/event-type.types";
import { LocalMatchEvent } from "../types/event.types";
import { calculatePercentage, RosterPlayerInfo} from "../statistics/calculators";
import { countsAsScoring, eventTeam } from "../statistics/calculators/event-rules";
import { PlayerDetailStatistic } from "../statistics/types/statistic.types";

const readJerseyNumber = (event: LocalMatchEvent): number | null => {
  const value = event.attributes?.['playerNumber'];
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * Estadísticas individuales con todos los eventos de carga en vivo que requieren jugador
 * (try, conversión, penal a palos, pase, patada a touch, salida, infracciones,
 * tarjetas y lesiones). Atribuye por `playerId` o por `playerNumber` del equipo propio.
 * `DROP_GOAL` y `PENALTY_TRY` no requieren jugador en el catálogo, por eso no figuran acá.
 */
export function computePlayerDetailStats(
  events: LocalMatchEvent[],
  roster: RosterPlayerInfo[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): PlayerDetailStatistic[] {
  const eventsByPlayerId = new Map<string, LocalMatchEvent[]>();
  const eventsByJersey = new Map<number, LocalMatchEvent[]>();

  for (const event of events) {
    if (event.playerId) {
      const list = eventsByPlayerId.get(event.playerId) ?? [];
      list.push(event);
      eventsByPlayerId.set(event.playerId, list);
    }
    const type = eventTypeMap.get(event.eventTypeId);
    if (eventTeam(type, event) !== 'OPPONENT') {
      const jersey = readJerseyNumber(event);
      if (jersey !== null) {
        const list = eventsByJersey.get(jersey) ?? [];
        list.push(event);
        eventsByJersey.set(jersey, list);
      }
    }
  }

  return roster.map(player => {
    const own = new Map<string, LocalMatchEvent>();
    for (const e of eventsByPlayerId.get(player.playerId) ?? []) own.set(e.id, e);
    for (const e of eventsByJersey.get(player.jerseyNumber) ?? []) own.set(e.id, e);

    const s = {
      totalPoints: 0, tries: 0, conversionsMade: 0, conversionAttempts: 0,
      penaltyKicksMade: 0, penaltyKickAttempts: 0,passes: 0, offloads: 0, badPasses: 0, kicksToTouch: 0, restarts: 0,
      penaltiesConceded: 0, yellowCards: 0, redCards: 0, injuries: 0, tacklesMade: 0,  tacklesMissed: 0, tackleEffectiveness: 0
    };

    for (const e of own.values()) {
      const type = eventTypeMap.get(e.eventTypeId);
      if (!type) continue;
      const scored = countsAsScoring(type, e.attributes);
      if (scored) s.totalPoints += type.points;

      switch (type.code) {
        case 'TRY': if (scored) s.tries++; break;
        case 'CONVERSION': s.conversionAttempts++; if (scored) s.conversionsMade++; break;
        case 'PENALTY_KICK': s.penaltyKickAttempts++; if (scored) s.penaltyKicksMade++; break;
        case 'PASS_OFFLOAD':
          s.passes++;
          if (e.attributes?.['passType'] === 'offload') s.offloads++;
          if (e.attributes?.['isBadPass'] === true) s.badPasses++;
          break;
        case 'TACKLE_MADE':
          s.tacklesMade++;
          break;
        case 'TACKLE_MISSED':
          s.tacklesMissed++;
          break;
        case 'KICK_TO_TOUCH': s.kicksToTouch++; break;
        case 'RESTART_KICK': s.restarts++; break;
        case 'PENALTY_CONCEDED': s.penaltiesConceded++; break;
        case 'YELLOW_CARD': s.yellowCards++; break;
        case 'RED_CARD': s.redCards++; break;
        case 'INJURY': s.injuries++; break;
      }
    }
    s.tackleEffectiveness = calculatePercentage(s.tacklesMade, s.tacklesMade + s.tacklesMissed, 0);
    const hasActivity = Object.values(s).some(value => value > 0);

    return {
      playerId: player.playerId,
      jerseyNumber: player.jerseyNumber,
      playerName: player.playerName,
      position: player.position,
      isStarter: player.isStarter,
      ...s,
      hasActivity,
    };
  });
}
