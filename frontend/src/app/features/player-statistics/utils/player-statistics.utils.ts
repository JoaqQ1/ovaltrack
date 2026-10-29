import { PlayerEventTypeValue, PlayerStatColumn, PlayerStatistic } from "../../match/statistics/types/statistic.types";
import { MatchResult, PlayerCountStat, PlayerMatchDTO, PlayerMatchHistory, PlayerMatchStatistic } from "../types/player-statistics.types";

export const EVENT_CODES = {
    TRY: 'TRY',
    CONVERSION: 'CONVERSION',
    PENALTY_KICK: 'PENALTY_KICK',
    YELLOW_CARD: 'YELLOW_CARD',
    RED_CARD: 'RED_CARD',
    PENALTY_CONCEDED: 'PENALTY_CONCEDED',

} as const;
export function toResult(match: PlayerMatchDTO): MatchResult {
    const { homeScore: home, awayScore: visitor } = match;

    if (home > visitor)
        return 'win';
    else if (home < visitor)
        return 'loss'
    return 'draw';
}
export function valueByCode(stat: PlayerStatistic, columns: PlayerStatColumn[], code: string): PlayerEventTypeValue {
    const column = columns.find(c => c.code === code);
    return (column && stat.values[column.eventTypeId]) ?? { count: 0, made: null };
}

export function toHistoryRow(matchStatistic: PlayerMatchStatistic): PlayerMatchHistory {
    const { match, columns, stat } = matchStatistic;
    const value = (code: string) => valueByCode(stat, columns, code);

    const conversions = value(EVENT_CODES.CONVERSION);
    const penaltyKicks = value(EVENT_CODES.PENALTY_KICK);
    return {
        matchId: match.matchId,
        date: match.date,
        opponent: match.opponentName,
        divisionName: match.divisionName,
        result: toResult(match),
        ownScore: match.homeScore,
        opponentScore: match.awayScore,
        isStarter: match.role === 'TITULAR',
        totalPoints: stat.totalPoints,
        tries: value(EVENT_CODES.TRY).count,
        conversionsMade: conversions.made ?? 0,
        conversionAttempts: conversions.count,
        penaltyKicksMade: penaltyKicks.made ?? 0,
        penaltyKickAttempts: penaltyKicks.count,
        yellowCards: value(EVENT_CODES.YELLOW_CARD).count,
        redCards: value(EVENT_CODES.RED_CARD).count,
    };
}
/**
 * Suma las estadísticas de varios partidos: `totalPoints` y, por `eventTypeId`, intentos y aciertos.
 * Los datos del jugador salen del primer partido; las columnas para `valueByCode` son las de
 * cualquier partido, porque todos se calculan con el mismo catálogo.
 */
export function sumPlayerStatistics(matchStatistics: PlayerMatchStatistic[]): PlayerStatistic {
    const empty: PlayerStatistic = {
        playerId: matchStatistics[0]?.stat.playerId ?? '',
        jerseyNumber: 0,
        playerName: matchStatistics[0]?.stat.playerName ?? '',
        isStarter: false,
        minutesPlayed: 0,
        totalPoints: 0,
        values: {},
        hasActivity: false,
    };

    return matchStatistics.reduce<PlayerStatistic>((total, { stat }) => ({
        ...total,
        minutesPlayed: total.minutesPlayed + stat.minutesPlayed,
        totalPoints: total.totalPoints + stat.totalPoints,
        values: sumValues(total.values, stat.values),
        hasActivity: total.hasActivity || stat.hasActivity,
    }), empty);
}

function sumValues(
    total: PlayerStatistic['values'],
    values: PlayerStatistic['values'],
): PlayerStatistic['values'] {
    const result = { ...total };
    for (const [eventTypeId, value] of Object.entries(values)) {
        const previous = result[eventTypeId];
        result[eventTypeId] = {
            count: (previous?.count ?? 0) + value.count,
            // `made` es null en los tipos que no suman: se mantiene null si nunca hubo aciertos que contar.
            made: previous?.made == null && value.made === null ? null : (previous?.made ?? 0) + (value.made ?? 0),
        };
    }
    return result;
}
export function seasonsOf(matchStatistics: PlayerMatchStatistic[]): string[] {
    const temporadas = new Set(matchStatistics.map(m => m.match.date.slice(0, 4)));
    return Array.from(temporadas).sort((a, b) => b.localeCompare(a));
}

/** Cantidad de cada tipo de evento del jugador, salvo los de `excludedCodes`, en orden de catálogo. */
export function otherStats(total: PlayerStatistic, columns: PlayerStatColumn[], excludedCodes: string[]): PlayerCountStat[] {
    const excluded = new Set(excludedCodes);
    return columns
        .filter(column => !excluded.has(column.code))
        .map(column => ({ label: column.label, value: total.values[column.eventTypeId]?.count ?? 0 }));
}
