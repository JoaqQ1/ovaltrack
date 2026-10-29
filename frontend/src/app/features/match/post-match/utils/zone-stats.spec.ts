import { describeSegment, findGaps, findOverlap, periodRange, suggestRange } from './zone-stats';
import { ZoneAssignmentResponse } from '../../types/zone.types';

describe('zone-stats', () => {
  const zone = (id: string, period: 1 | 2, startMinute: number, endMinute: number): ZoneAssignmentResponse =>
    ({ id, matchId: 'm', period, startMinute, endMinute, row: 2, col: 3 });

  describe('periodRange', () => {
    it('1T va de 0 a 40 y 2T de 40 a 80', () => {
      expect(periodRange(1)).toEqual({ start: 0, end: 40 });
      expect(periodRange(2)).toEqual({ start: 40, end: 80 });
    });
  });

  describe('findGaps', () => {
    it('sin tramos todo el tiempo es un hueco', () => {
      expect(findGaps([], 1)).toEqual([{ start: 0, end: 40 }]);
      expect(findGaps([], 2)).toEqual([{ start: 40, end: 80 }]);
    });

    it('devuelve los huecos entre tramos y los bordes', () => {
      const zones = [zone('a', 1, 5, 10), zone('b', 1, 25, 30)];

      expect(findGaps(zones, 1)).toEqual([{ start: 0, end: 5 }, { start: 10, end: 25 }, { start: 30, end: 40 }]);
    });

    it('tramos contiguos no dejan hueco', () => {
      expect(findGaps([zone('a', 1, 0, 20), zone('b', 1, 20, 40)], 1)).toEqual([]);
    });

    it('ignora los tramos del otro tiempo', () => {
      expect(findGaps([zone('a', 2, 40, 80)], 1)).toEqual([{ start: 0, end: 40 }]);
    });

    it('no depende del orden en que llegan los tramos', () => {
      const zones = [zone('b', 1, 25, 30), zone('a', 1, 5, 10)];

      expect(findGaps(zones, 1).length).toBe(3);
    });
  });

  describe('suggestRange', () => {
    it('propone 5 minutos desde el primer hueco', () => {
      expect(suggestRange([zone('a', 1, 0, 10)], 1)).toEqual({ start: 10, end: 15 });
    });

    it('sin tramos propone los primeros 5 minutos del tiempo', () => {
      expect(suggestRange([], 2)).toEqual({ start: 40, end: 45 });
    });

    it('no excede el tamaño del hueco', () => {
      expect(suggestRange([zone('a', 1, 0, 10), zone('b', 1, 12, 40)], 1)).toEqual({ start: 10, end: 12 });
    });

    it('continúa desde el fin del tramo recién guardado', () => {
      const zones = [zone('a', 1, 20, 25)];

      expect(suggestRange(zones, 1, 25)).toEqual({ start: 25, end: 30 });
    });

    it('si no hay hueco posterior vuelve al primer hueco libre', () => {
      const zones = [zone('a', 1, 10, 40)];

      expect(suggestRange(zones, 1, 40)).toEqual({ start: 0, end: 5 });
    });

    it('devuelve null con el tiempo completamente cubierto', () => {
      expect(suggestRange([zone('a', 1, 0, 40)], 1)).toBeNull();
    });
  });

  describe('findOverlap', () => {
    const zones = [zone('a', 1, 10, 25)];

    it('detecta solapes parciales y contenidos', () => {
      expect(findOverlap({ period: 1, startMinute: 20, endMinute: 30 }, zones)?.id).toBe('a');
      expect(findOverlap({ period: 1, startMinute: 12, endMinute: 15 }, zones)?.id).toBe('a');
    });

    it('rangos contiguos no se solapan', () => {
      expect(findOverlap({ period: 1, startMinute: 25, endMinute: 40 }, zones)).toBeNull();
      expect(findOverlap({ period: 1, startMinute: 0, endMinute: 10 }, zones)).toBeNull();
    });

    it('no compara contra el otro tiempo', () => {
      expect(findOverlap({ period: 2, startMinute: 40, endMinute: 60 }, zones)).toBeNull();
    });

    it('al editar ignora el propio tramo', () => {
      expect(findOverlap({ period: 1, startMinute: 10, endMinute: 25 }, zones, 'a')).toBeNull();
    });
  });

  it('describe un tramo con su zona', () => {
    expect(describeSegment(zone('a', 1, 10, 25))).toBe("1T 10'–25' (C3)");
  });
});
