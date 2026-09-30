import { LocalMatchEvent, LiveCaptureEventType } from '../../types/live-capture.types';
import { PlayerPeriodStatistic } from '../../types/statistic.types';

export interface RosterPlayerInfo {
  playerId: string;
  jerseyNumber: number;
  playerName: string;
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

  // Agrupamos eventos por playerId para consultas instantáneas
  const eventsByPlayer = new Map<string, LocalMatchEvent[]>();
  for (const event of events) {
    if (event.playerId) {
      const list = eventsByPlayer.get(event.playerId) ?? [];
      list.push(event);
      eventsByPlayer.set(event.playerId, list);
    }
  }

  return roster.map(player => {
    const playerEvents = eventsByPlayer.get(player.playerId) ?? [];

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
