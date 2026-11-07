import { CLUB_DAY_MATCH_MINUTES, assignLanes, layoutClubDay, toClubDayItem } from './club-day-lanes';

const item = (id: string, startHour: number, startMinute = 0) => toClubDayItem(id, new Date(2026, 10, 7, startHour, startMinute));

describe('club-day-lanes', () => {
  it('partidos que no se solapan comparten carril', () => {
    const { lanes, laneCount } = assignLanes([item('a', 9), item('b', 12)]);
    expect(laneCount).toBe(1);
    expect(lanes.map(l => l.lane)).toEqual([0, 0]);
  });

  it('un partido que empieza justo cuando termina el otro no se solapa', () => {
    const first = item('a', 9);
    const second = { id: 'b', startMinute: first.endMinute, endMinute: first.endMinute + CLUB_DAY_MATCH_MINUTES };
    expect(assignLanes([first, second]).laneCount).toBe(1);
  });

  it('los solapes van en carriles distintos', () => {
    const { lanes, laneCount } = assignLanes([item('a', 10), item('b', 10, 30), item('c', 11)]);
    expect(laneCount).toBe(3);
    expect(lanes.map(l => [l.id, l.lane])).toEqual([['a', 0], ['b', 1], ['c', 2]]);
  });

  it('reutiliza un carril liberado', () => {
    const { lanes } = assignLanes([item('a', 9), item('b', 9, 30), item('c', 11)]);
    expect(lanes.find(l => l.id === 'c')!.lane).toBe(0);
  });

  it('ordena por inicio aunque la entrada venga desordenada', () => {
    const { lanes } = assignLanes([item('tarde', 15), item('temprano', 9)]);
    expect(lanes.map(l => l.id)).toEqual(['temprano', 'tarde']);
  });

  describe('layoutClubDay', () => {
    it('sin partidos no hay timeline', () => {
      expect(layoutClubDay([])).toBeNull();
    });

    it('el rango se calcula del día, en horas redondas y con margen', () => {
      const layout = layoutClubDay([item('a', 10), item('b', 15, 30)])!;
      // 10:00 − 30′ → 09:00 ; 15:30 + 100′ + 30′ = 17:40 → 18:00
      expect(layout.range).toEqual({ startMinute: 9 * 60, endMinute: 18 * 60 });
    });

    it('no se sale del día', () => {
      const layout = layoutClubDay([item('a', 0, 10), item('b', 23, 0)])!;
      expect(layout.range.startMinute).toBe(0);
      expect(layout.range.endMinute).toBe(24 * 60);
    });
  });
});
