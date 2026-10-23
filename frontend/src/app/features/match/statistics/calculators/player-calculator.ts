import { LiveCaptureEventType } from '../../types/event-type.types';
import { LocalMatchEvent } from '../../types/event.types';
import { PlayerPeriodStatistic } from '../../statistics/types/statistic.types';
import { countsAsScoring, eventTeam } from './event-rules';

export interface RosterPlayerInfo {
  playerId: string;
  jerseyNumber: number;
  playerName: string;
  position?: string;
  isStarter: boolean;
}

/**
 * Calcula las estadísticas individuales por jugador durante un período.
 */
export function computePlayerPeriodStats(
  events: LocalMatchEvent[],
  roster: RosterPlayerInfo[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): PlayerPeriodStatistic[] {
  const readJerseyNumber = (event: LocalMatchEvent): number | null => {
    const value = event.attributes?.['playerNumber'];
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // Agrupamos eventos por playerId y por número de camiseta para el equipo propio
  const eventsByPlayerId = new Map<string, LocalMatchEvent[]>();
  const eventsByJersey = new Map<number, LocalMatchEvent[]>();

  for (const event of events) {
    if (event.playerId) {
      const list = eventsByPlayerId.get(event.playerId) ?? [];
      list.push(event);
      eventsByPlayerId.set(event.playerId, list);
    }

    const et = eventTypeMap.get(event.eventTypeId);
    if (eventTeam(et, event) !== 'OPPONENT') {
      const jersey = readJerseyNumber(event);
      if (jersey !== null) {
        const list = eventsByJersey.get(jersey) ?? [];
        list.push(event);
        eventsByJersey.set(jersey, list);
      }
    }
  }

  return roster.map(player => {
    const playerEventsMap = new Map<string, LocalMatchEvent>();

    if (player.playerId) {
      const byId = eventsByPlayerId.get(player.playerId) ?? [];
      for (const e of byId) playerEventsMap.set(e.id, e);
    }

    const byJersey = eventsByJersey.get(player.jerseyNumber) ?? [];
    for (const e of byJersey) playerEventsMap.set(e.id, e);

    const playerEvents = Array.from(playerEventsMap.values());

    let tries = 0;
    let conversions = 0;
    let penaltyKicks = 0;
    let dropGoals = 0;
    let yellowCards = 0;
    let redCards = 0;

    let totalPoints = 0;
    for (const e of playerEvents) {
      const et = eventTypeMap.get(e.eventTypeId);
      if (!et) continue;
      const scored = countsAsScoring(et, e.attributes);
      if (scored) totalPoints += et.points;

      switch (et.code) {
        case 'TRY':          if (scored) tries++; break;
        case 'CONVERSION':   if (scored) conversions++; break;
        case 'PENALTY_KICK': if (scored) penaltyKicks++; break;
        case 'DROP_GOAL':    if (scored) dropGoals++; break;
        case 'YELLOW_CARD':  yellowCards++; break;
        case 'RED_CARD':     redCards++; break;
      }
    }

    const minutesPlayed = player.isStarter ? 40 : 0;

    return {
      playerId: player.playerId,
      jerseyNumber: player.jerseyNumber,
      playerName: player.playerName,
      position: player.position,
      isStarter: player.isStarter,
      minutesPlayed,
      tries,
      conversions,
      penaltyKicks,
      dropGoals,
      totalPoints,
      yellowCards,
      redCards,
    };
  }).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
}
