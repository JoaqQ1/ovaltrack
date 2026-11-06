/** Un partido de rugby ocupa ~100 min en la agenda: 2 × 40′, entretiempo y margen. */
export const CLUB_DAY_MATCH_MINUTES = 100;
const RANGE_PADDING_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

export interface ClubDayItem {
  id: string;
  /** Minutos desde la medianoche. */
  startMinute: number;
  endMinute: number;
}

export interface ClubDayLane extends ClubDayItem {
  /** Carril (0 = el de arriba): los partidos que se solapan van en carriles distintos. */
  lane: number;
}

export interface ClubDayLayout {
  /** Rango visible calculado del día, en horas redondas. */
  range: { startMinute: number; endMinute: number };
  items: ClubDayLane[];
  laneCount: number;
}

/** Reparte en el menor número de carriles posible; los que se tocan sin solaparse comparten carril. */
export function assignLanes(items: readonly ClubDayItem[]): { lanes: ClubDayLane[]; laneCount: number } {
  const laneEnds: number[] = [];
  const lanes = [...items]
    .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute)
    .map(item => {
      let lane = laneEnds.findIndex(end => end <= item.startMinute);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.endMinute;
      return { ...item, lane };
    });
  return { lanes, laneCount: laneEnds.length };
}

/** `null` si el día no tiene partidos. El rango se ajusta a los partidos: no es una grilla fija. */
export function layoutClubDay(items: readonly ClubDayItem[]): ClubDayLayout | null {
  if (items.length === 0) return null;
  const earliest = Math.min(...items.map(item => item.startMinute));
  const latest = Math.max(...items.map(item => item.endMinute));
  const startMinute = Math.max(0, Math.floor((earliest - RANGE_PADDING_MINUTES) / 60) * 60);
  const endMinute = Math.min(MINUTES_PER_DAY, Math.ceil((latest + RANGE_PADDING_MINUTES) / 60) * 60);
  const { lanes, laneCount } = assignLanes(items);
  return { range: { startMinute, endMinute }, items: lanes, laneCount };
}

export function toClubDayItem(id: string, start: Date): ClubDayItem {
  const startMinute = start.getHours() * 60 + start.getMinutes();
  return { id, startMinute, endMinute: startMinute + CLUB_DAY_MATCH_MINUTES };
}
