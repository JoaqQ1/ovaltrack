import { LiveCaptureEventType } from "../types/event-type.types";
import { LocalMatchEvent } from "../types/event.types";
import { countsAsScoring, eventTeam, Team } from "./calculators/event-rules";
import { calculatePercentage } from "./calculators/math-utils";

export type MetricFormat = 'int' | 'percent' | 'decimal';

/** Fila "propio vs rival" de un valor numérico (puede ser null si no hay datos cargados). */
export interface DetailMetric {
  label: string;
  own: number | null;
  opponent: number | null;
  format?: MetricFormat;
  unit?: string;
  hint?: string;
}

export interface DetailRow {
  label: string;
  own: number;
  opponent: number;
}

/** Distribución de un campo `select` del catálogo (una fila por opción). */
export interface DetailBreakdown {
  title: string;
  rows: DetailRow[];
}

export interface DetailSection {
  id: string;
  title: string;
  icon: string;
  note?: string;
  metrics: DetailMetric[];
  breakdowns: DetailBreakdown[];
}

export interface MatchDetailStatistics {
  sections: DetailSection[];
  /** Tries penal (7 pts). El DTO base los suma dentro de `ownTries`/`opponentTries`. */
  penaltyTries: { own: number; opponent: number };
}

interface Tagged {
  event: LocalMatchEvent;
  type: LiveCaptureEventType;
  team: Team;
}

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
};

/**
 * Estadísticas detalladas derivadas de TODOS los campos del catálogo de eventos
 * (campos `live` y `post`). Los equipos se resuelven con `eventTeam`, es decir, el
 * equipo que ejecuta el evento. Recibe eventos activos ya filtrados por período.
 */
export function computeMatchDetailStats(
  events: LocalMatchEvent[],
  eventTypeMap: Map<string, LiveCaptureEventType>
): MatchDetailStatistics {
  const typeByCode = new Map<string, LiveCaptureEventType>();
  eventTypeMap.forEach(type => typeByCode.set(type.code, type));

  const byCode = new Map<string, Tagged[]>();
  for (const event of events) {
    const type = eventTypeMap.get(event.eventTypeId);
    const team = eventTeam(type, event);
    if (!type || !team) continue;
    const list = byCode.get(type.code) ?? [];
    list.push({ event, type, team });
    byCode.set(type.code, list);
  }

  // ---------- helpers ----------
  const get = (code: string): Tagged[] => byCode.get(code) ?? [];
  const own = (items: Tagged[]) => items.filter(i => i.team === 'OWN');
  const opp = (items: Tagged[]) => items.filter(i => i.team === 'OPPONENT');
  const attr = (item: Tagged, key: string) => item.event.attributes?.[key];
  const withAttr = (items: Tagged[], key: string, value: unknown) => items.filter(i => attr(i, key) === value);
  const numbers = (items: Tagged[], key: string): number[] =>
    items.map(i => readNumber(attr(i, key))).filter((n): n is number => n !== null);
  const total = (values: number[]) => values.reduce((acc, n) => acc + n, 0);
  const isMade = (item: Tagged) => countsAsScoring(item.type, item.event.attributes);

  const count = (label: string, items: Tagged[], hint?: string): DetailMetric =>
    ({ label, own: own(items).length, opponent: opp(items).length, hint });

  const sum = (label: string, items: Tagged[], key: string, unit?: string): DetailMetric => {
    const o = numbers(own(items), key);
    const p = numbers(opp(items), key);
    return { label, own: o.length ? total(o) : null, opponent: p.length ? total(p) : null, unit };
  };

  const average = (label: string, items: Tagged[], key: string, unit?: string): DetailMetric => {
    const o = numbers(own(items), key);
    const p = numbers(opp(items), key);
    return {
      label, unit, format: 'decimal',
      own: o.length ? total(o) / o.length : null,
      opponent: p.length ? total(p) / p.length : null,
    };
  };

  const percent = (label: string, partOwn: number, totalOwn: number, partOpp: number, totalOpp: number): DetailMetric => ({
    label, format: 'percent',
    own: totalOwn > 0 ? calculatePercentage(partOwn, totalOwn) : null,
    opponent: totalOpp > 0 ? calculatePercentage(partOpp, totalOpp) : null,
  });

  /** Distribución de un campo select: una fila por opción del catálogo + "Sin completar". */
  const breakdown = (title: string, code: string, key: string): DetailBreakdown => {
    const items = get(code);
    const options = typeByCode.get(code)?.templateEventFields?.find(f => f.key === key)?.options ?? [];
    const known = new Set(options.map(o => o.value));
    const rows: DetailRow[] = options.map(option => {
      const matching = withAttr(items, key, option.value);
      return { label: option.label, own: own(matching).length, opponent: opp(matching).length };
    });
    const pending = items.filter(i => !known.has(String(attr(i, key))));
    rows.push({ label: 'Sin completar', own: own(pending).length, opponent: opp(pending).length });
    return { title, rows: rows.filter(r => r.own + r.opponent > 0) };
  };

  const pointsFrom = (label: string, code: string): DetailMetric => {
    const made = get(code).filter(isMade);
    const pts = (items: Tagged[]) => items.reduce((acc, i) => acc + i.type.points, 0);
    return { label, own: pts(own(made)), opponent: pts(opp(made)) };
  };

  const kickMetrics = (names: [string, string, string], code: string): DetailMetric[] => {
    const items = get(code);
    const made = items.filter(isMade);
    const [o, p] = [own(items).length, opp(items).length];
    const [om, pm] = [own(made).length, opp(made).length];
    return [
      { label: names[0], own: o, opponent: p },
      { label: names[1], own: om, opponent: pm },
      percent(names[2], om, o, pm, p),
    ];
  };

  // Penales concedidos en fijas: `penalty_against` los comete el equipo que ejecuta, `penalty_for` el rival.
  const setPiecePenalties = (code: string, key: string): DetailMetric => {
    const items = get(code);
    const against = withAttr(items, key, 'penalty_against');
    const favor = withAttr(items, key, 'penalty_for');
    return {
      label: code === 'SCRUM' ? 'Penales concedidos en scrum' : 'Penales concedidos en line-out',
      own: own(against).length + opp(favor).length,
      opponent: opp(against).length + own(favor).length,
    };
  };

  // ---------- Puntuación ----------
  const penaltyTryItems = get('PENALTY_TRY').filter(isMade);
  const scoring: DetailSection = {
    id: 'scoring',
    title: 'Puntuación',
    icon: 'bi-trophy',
    metrics: [
      pointsFrom('Puntos por tries', 'TRY'),
      pointsFrom('Puntos por tries penal', 'PENALTY_TRY'),
      pointsFrom('Puntos por conversiones', 'CONVERSION'),
      pointsFrom('Puntos por penales a palos', 'PENALTY_KICK'),
      pointsFrom('Puntos por drop goals', 'DROP_GOAL'),
    ],
    breakdowns: [
      breakdown('Tries por zona de apoyo', 'TRY', 'zone'),
      breakdown('Causa del try penal', 'PENALTY_TRY', 'reason'),
    ],
  };

  // ---------- Pateo a los palos ----------
  const allKicks = [...get('CONVERSION'), ...get('PENALTY_KICK'), ...get('DROP_GOAL')];
  const kicking: DetailSection = {
    id: 'kicking',
    title: 'Pateo a los palos',
    icon: 'bi-bullseye',
    note: 'La distancia y la zona se completan después, con el video: solo se promedian las patadas que las tienen.',
    metrics: [
      ...kickMetrics(['Conversiones intentadas', 'Conversiones convertidas', 'Efectividad de conversiones'], 'CONVERSION'),
      ...kickMetrics(['Penales a palos intentados', 'Penales a palos convertidos', 'Efectividad de penales'], 'PENALTY_KICK'),
      ...kickMetrics(['Drop goals intentados', 'Drop goals convertidos', 'Efectividad de drop goals'], 'DROP_GOAL'),
      average('Distancia media de patadas', allKicks, 'distanceMeters', 'm'),
    ],
    breakdowns: [
      breakdown('Zona de patada · conversiones', 'CONVERSION', 'zone'),
      breakdown('Zona de patada · penales', 'PENALTY_KICK', 'zone'),
    ],
  };

  // ---------- Ataque ----------
  const attack: DetailSection = {
    id: 'attack',
    title: 'Ataque',
    icon: 'bi-lightning-charge',
    metrics: [
      count('Acarreos', get('CARRY')),
      sum('Metros ganados en acarreos', get('CARRY'), 'metersGained', 'm'),
      average('Metros medios por acarreo', get('CARRY'), 'metersGained', 'm'),
      sum('Defensores eludidos', get('CARRY'), 'defendersBeaten'),
      count('Pases / offloads', get('PASS_OFFLOAD')),
      count('Pases comprometidos', withAttr(get('PASS_OFFLOAD'), 'isBadPass', true)),
      count('Rucks ofensivos', get('RUCK_OFFENSIVE')),
      count('Quiebres de línea', get('LINEBREAK')),
      sum('Metros netos en quiebres', get('LINEBREAK'), 'metersGained', 'm'),
      count('Ingresos a 22m rival', get('ENTRY_22')),
      count('Patadas en juego', get('KICK_IN_PLAY')),
      count('Patadas a touch', get('KICK_TO_TOUCH')),
    ],
    breakdowns: [
      breakdown('Tipo de pase', 'PASS_OFFLOAD', 'passType'),
      breakdown('Velocidad de reciclaje', 'RUCK_OFFENSIVE', 'speed'),
      breakdown('Tipo de patada en juego', 'KICK_IN_PLAY', 'kickType'),
      breakdown('Resultado de la patada en juego', 'KICK_IN_PLAY', 'outcome'),
      breakdown('Patada a touch', 'KICK_TO_TOUCH', 'kind'),
    ],
  };

  // ---------- Juego fijo ----------
  const setPieces: DetailSection = {
    id: 'set-pieces',
    title: 'Juego fijo',
    icon: 'bi-diagram-3',
    note: 'Cada resultado se cuenta para el equipo que ejecutó la jugada (quien introduce o lanza), con el texto del catálogo.',
    metrics: [
      count('Scrums', get('SCRUM')),
      count('Line-outs', get('LINEOUT')),
      count('Line-outs que generaron maul', withAttr(get('LINEOUT'), 'isMaulFormed', true)),
      count('Mauls', get('MAUL')),
      sum('Metros de avance en mauls', get('MAUL'), 'metersGained', 'm'),
      count('Kick-offs / salidas', get('RESTART_KICK')),
    ],
    breakdowns: [
      breakdown('Resultado de scrum', 'SCRUM', 'scrumResult'),
      breakdown('Resultado de line-out', 'LINEOUT', 'lineResult'),
      breakdown('Zona de salto', 'LINEOUT', 'jumpZone'),
      breakdown('Resultado del maul', 'MAUL', 'maulOutcome'),
      breakdown('Resultado del kick-off', 'RESTART_KICK', 'outcome'),
      breakdown('Tipo de salida', 'RESTART_KICK', 'kickType'),
    ],
  };

  // ---------- Defensa ----------
  const tacklesMade = get('TACKLE_MADE');
  const tacklesMissed = get('TACKLE_MISSED');
  const defense: DetailSection = {
    id: 'defense',
    title: 'Defensa',
    icon: 'bi-shield',
    metrics: [
      count('Tackles completados', tacklesMade),
      count('Tackles fallados', tacklesMissed),
      percent(
        'Efectividad de tackles',
        own(tacklesMade).length, own(tacklesMade).length + own(tacklesMissed).length,
        opp(tacklesMade).length, opp(tacklesMade).length + opp(tacklesMissed).length
      ),
      count('Tackles asistidos', withAttr(tacklesMade, 'assisted', true)),
    ],
    breakdowns: [breakdown('Motivo del tackle fallado', 'TACKLE_MISSED', 'failReason')],
  };

  // ---------- Cambios de posesión ----------
  const possessionChanges: DetailSection = {
    id: 'possession-changes',
    title: 'Cambios de posesión',
    icon: 'bi-arrow-left-right',
    metrics: [
      count('Turnovers ganados', get('TURNOVER_WON')),
      count('Errores de manejo', get('HANDLING_ERROR')),
      count('Otros cambios de posesión', get('OTHER_TURNOVER')),
      count('Recepciones de patada', get('KICK_RECEPTION')),
    ],
    breakdowns: [
      breakdown('Cómo se ganó el turnover', 'TURNOVER_WON', 'stealType'),
      breakdown('Tipo de error de manejo', 'HANDLING_ERROR', 'errorType'),
      breakdown('Resultado de la recepción', 'KICK_RECEPTION', 'receptionQuality'),
      breakdown('Causa de otros cambios', 'OTHER_TURNOVER', 'reason'),
    ],
  };

  // ---------- Disciplina ----------
  const yellowDefault = readNumber(
    typeByCode.get('YELLOW_CARD')?.templateEventFields?.find(f => f.key === 'durationMinutes')?.default
  ) ?? 10;
  const yellowMinutes = (items: Tagged[]) =>
    total(items.map(i => readNumber(attr(i, 'durationMinutes')) ?? yellowDefault));

  const discipline: DetailSection = {
    id: 'discipline',
    title: 'Disciplina',
    icon: 'bi-exclamation-triangle',
    note: 'Los minutos de suspensión usan el valor del catálogo (10) cuando todavía no se completó la duración.',
    metrics: [
      count('Penales en juego abierto', get('PENALTY_CONCEDED')),
      setPiecePenalties('SCRUM', 'scrumResult'),
      setPiecePenalties('LINEOUT', 'lineResult'),
      count('Tarjetas amarillas', get('YELLOW_CARD')),
      count('Tarjetas rojas', get('RED_CARD')),
      {
        label: 'Minutos de suspensión (amarillas)',
        own: yellowMinutes(own(get('YELLOW_CARD'))),
        opponent: yellowMinutes(opp(get('YELLOW_CARD'))),
        unit: 'min',
      },
    ],
    breakdowns: [
      breakdown('Tipo de infracción', 'PENALTY_CONCEDED', 'penaltyType'),
      breakdown('Motivo de amarilla', 'YELLOW_CARD', 'reason'),
      breakdown('Motivo de roja', 'RED_CARD', 'reason'),
    ],
  };

  // ---------- Lesiones y cambios ----------
  const health: DetailSection = {
    id: 'health',
    title: 'Lesiones y cambios',
    icon: 'bi-bandaid',
    metrics: [
      count('Lesiones', get('INJURY')),
      count('Cambios / sustituciones', get('SUBSTITUTION')),
    ],
    breakdowns: [breakdown('Zona de la lesión', 'INJURY', 'injuryArea')],
  };

  return {
    sections: [scoring, kicking, attack, setPieces, defense, possessionChanges, discipline, health],
    penaltyTries: { own: own(penaltyTryItems).length, opponent: opp(penaltyTryItems).length },
  };
}
