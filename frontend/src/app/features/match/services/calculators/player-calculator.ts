import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
import { PlayerPeriodStatistic } from '../../types/statistic.types';

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
  const getName = (e: LocalMatchEvent) => eventTypeMap.get(e.eventTypeId)?.name ?? '';

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

    if (event.teamPossession !== 'OPPONENT') {
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

    for (const e of playerEvents) {
      const typeName = getName(e);
      switch (typeName) {
        case 'Try':
          tries++;
          break;
        case 'Conversión':
        case 'Conversion':
          conversions++;
          break;
        case 'Penal a los palos':
          penaltyKicks++;
          break;
        case 'Drop gol':
          dropGoals++;
          break;
        case 'Amonestación':
          yellowCards++;
          break;
        case 'Expulsión':
          redCards++;
          break;
      }
    }

    const totalPoints = (tries * 5) + (conversions * 2) + (penaltyKicks * 3) + (dropGoals * 3);
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
