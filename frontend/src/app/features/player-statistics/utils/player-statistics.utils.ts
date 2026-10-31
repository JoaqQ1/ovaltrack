import { PlayerEventTypeValue, PlayerStatColumn, PlayerStatistic } from "../../match/statistics/types/statistic.types";
import { MatchResult, PlayerCountStat, PlayerKpi, PlayerMatchDTO, PlayerMatchHistory, PlayerMatchStatistic, PlayerStatSection } from "../types/player-statistics.types";

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

/** Títulos para el jugador cuando el nombre del grupo en el catálogo es técnico. */
const SECTION_TITLES: Record<string, string> = {
    'Puntuación': 'Puntos y pateo',
    'Neutro': 'Disciplina',
};

/** Nombres para el jugador cuando el del catálogo es técnico; los demás usan el del catálogo. */
const FRIENDLY_LABELS: Record<string, string> = {
    PENALTY_KICK: 'Penales a palos',
    PENALTY_CONCEDED: 'Penales cometidos',
    YELLOW_CARD: 'Tarjetas amarillas',
    RED_CARD: 'Tarjetas rojas',
};

/** Tipos que requieren jugador pero no son una acción de juego. */
const NON_PLAY_CODES = new Set(['INJURY', 'SUBSTITUTION']);

const playColumns = (columns: PlayerStatColumn[]): PlayerStatColumn[] =>
    columns.filter(column => !NON_PLAY_CODES.has(column.code));

const friendlyLabel = (column: PlayerStatColumn): string => FRIENDLY_LABELS[column.code] ?? column.label;

const effectiveness = (made: number, attempts: number): number =>
    attempts === 0 ? 0 : Math.round((made / attempts) * 100);

/** Los cuatro datos principales del partido, con su significado explicado. */
export function toMatchHighlights(matchStatistic: PlayerMatchStatistic): PlayerKpi[] {
    const { columns, stat } = matchStatistic;
    const count = (code: string) => valueByCode(stat, columns, code).count;
    const tacklesMade = count('TACKLE_MADE');
    const tackles = tacklesMade + count('TACKLE_MISSED');
    const yellowCards = count(EVENT_CODES.YELLOW_CARD);
    const redCards = count(EVENT_CODES.RED_CARD);

    return [
        { label: 'Puntos', value: `${stat.totalPoints}`, detail: 'Conseguidos por vos' },
        { label: 'Tries', value: `${count(EVENT_CODES.TRY)}`, detail: 'Apoyados por vos' },
        {
            label: 'Tackles',
            value: tackles === 0 ? '—' : `${tacklesMade} de ${tackles}`,
            detail: tackles === 0 ? 'Sin tackles registrados' : `${effectiveness(tacklesMade, tackles)}% completados`,
        },
        {
            label: 'Penales cometidos',
            value: `${count(EVENT_CODES.PENALTY_CONCEDED)}`,
            detail: yellowCards + redCards === 0 ? 'Sin tarjetas' : `${yellowCards} amarilla(s) · ${redCards} roja(s)`,
        },
    ];
}

/** Secciones del detalle: solo las acciones que el jugador registró, en orden de catálogo. */
export function toStatSections(matchStatistic: PlayerMatchStatistic): PlayerStatSection[] {
    const { columns, stat } = matchStatistic;
    const sections: PlayerStatSection[] = [];

    for (const column of playColumns(columns)) {
        const value = stat.values[column.eventTypeId];
        if (!value || value.count === 0) continue;

        const title = SECTION_TITLES[column.groupName] ?? column.groupName;
        let section = sections.find(candidate => candidate.title === title);
        if (!section) {
            section = { title, rows: [] };
            sections.push(section);
        }
        const made = value.made ?? 0;
        section.rows.push({
            label: friendlyLabel(column),
            value: column.hasAttempts ? `${made} de ${value.count}` : `${value.count}`,
            percent: column.hasAttempts ? effectiveness(made, value.count) : null,
        });
    }
    return sections;
}

/** Acciones sin registros en el partido, para aclarar que no faltan datos en la pantalla. */
export function unrecordedStats(matchStatistic: PlayerMatchStatistic): string[] {
    const { columns, stat } = matchStatistic;
    return playColumns(columns)
        .filter(column => (stat.values[column.eventTypeId]?.count ?? 0) === 0)
        .map(friendlyLabel);
}

/** Cantidad de cada tipo de evento del jugador, salvo los de `excludedCodes`, en orden de catálogo. */
export function otherStats(total: PlayerStatistic, columns: PlayerStatColumn[], excludedCodes: string[]): PlayerCountStat[] {
    const excluded = new Set(excludedCodes);
    return columns
        .filter(column => !excluded.has(column.code))
        .map(column => ({ label: column.label, value: total.values[column.eventTypeId]?.count ?? 0 }));
}
