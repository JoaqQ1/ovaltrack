import { ZoneAssignmentResponse } from '../../types/zone.types';
import { ZoneEvent } from './zone-stats';
import {
  allGaps, blockLabel, blockLayout, countByFranja, gapAtMinute, gapsWithEventCount, isOutsidePeriodFilter, isShortBlock,
  minuteAtOffset, minuteToPercent, suggestNextRange, territoryRows
} from './zone-track-layout';

describe('zone-track-layout', () => {
  const zone = (id: string, period: 1 | 2, startMinute: number, endMinute: number, row = 2, col = 3): ZoneAssignmentResponse =>
    ({ id, matchId: 'm', period, startMinute, endMinute, row, col });
  const ev = (id: string, period: 1 | 2, minute: number, cell: { row: number; col: number } | null): ZoneEvent =>
    ({ id, period, matchTime: minute * 60, zone: cell });

  describe('posición y ancho de los bloques', () => {
    it('el eje cubre 80 minutos: el 40 queda al 50 %', () => {
      expect(minuteToPercent(0)).toBe(0);
      expect(minuteToPercent(40)).toBe(50);
      expect(minuteToPercent(80)).toBe(100);
    });

    it('un bloque de 10 a 25 empieza al 12,5 % y ocupa el 18,75 %', () => {
      expect(blockLayout({ startMinute: 10, endMinute: 25 })).toEqual({ left: 12.5, width: 18.75 });
    });

    it('un tramo del 2T usa minutos acumulados', () => {
      expect(blockLayout({ startMinute: 60, endMinute: 80 })).toEqual({ left: 75, width: 25 });
    });
  });

  describe('bloques cortos', () => {
    it('de 1 o 2 minutos son cortos; de 3 o más, no', () => {
      expect(isShortBlock({ startMinute: 10, endMinute: 11 })).toBeTrue();
      expect(isShortBlock({ startMinute: 10, endMinute: 12 })).toBeTrue();
      expect(isShortBlock({ startMinute: 10, endMinute: 13 })).toBeFalse();
    });

    it('la etiqueta es la celda completa, o solo la letra del lateral si es corto', () => {
      expect(blockLabel(zone('a', 1, 10, 25, 3, 5))).toBe('D5');
      expect(blockLabel(zone('b', 1, 10, 11, 3, 5))).toBe('D');
      expect(blockLabel(zone('c', 1, 10, 12, 1, 2))).toBe('I');
    });
  });

  describe('territoryRows', () => {
    it('lista las 6 franjas con el in-goal rival arriba y el propio abajo', () => {
      const rows = territoryRows();

      expect(rows.map(r => r.col)).toEqual([6, 5, 4, 3, 2, 1]);
      expect(rows[0].name).toBe('In-goal rival');
      expect(rows[5].name).toBe('In-goal propio');
    });

    it('informa los metros de cada franja y "in-goal" para los extremos', () => {
      const rows = territoryRows();

      expect(rows[0].range).toBe('in-goal');
      expect(rows[1].range).toBe('78–100 m');
      expect(rows[2].range).toBe('50–78 m');
      expect(rows[5].range).toBe('in-goal');
    });
  });

  describe('countByFranja', () => {
    const events = [ev('a', 1, 5, { row: 1, col: 3 }), ev('b', 1, 8, { row: 2, col: 3 }), ev('c', 2, 50, { row: 2, col: 5 }), ev('d', 2, 60, null)];

    it('cuenta los eventos con zona por columna e ignora los sin zona', () => {
      const counts = countByFranja(events, 'ALL');

      expect(counts.get(3)).toBe(2);
      expect(counts.get(5)).toBe(1);
      expect(counts.has(1)).toBeFalse();
    });

    it('respeta el filtro de tiempo', () => {
      expect(countByFranja(events, 1).get(3)).toBe(2);
      expect(countByFranja(events, 1).has(5)).toBeFalse();
      expect(countByFranja(events, 2).get(5)).toBe(1);
    });
  });

  describe('minuteAtOffset', () => {
    it('convierte la posición horizontal en minuto entero', () => {
      expect(minuteAtOffset(0, 800)).toBe(0);
      expect(minuteAtOffset(400, 800)).toBe(40);
      expect(minuteAtOffset(409, 800)).toBe(40);
    });

    it('limita a 0–79 fuera del eje y con ancho inválido', () => {
      expect(minuteAtOffset(-30, 800)).toBe(0);
      expect(minuteAtOffset(900, 800)).toBe(79);
      expect(minuteAtOffset(100, 0)).toBe(0);
    });
  });

  describe('huecos', () => {
    const assignments = [zone('a', 1, 10, 25), zone('b', 2, 40, 60)];

    it('lista los huecos de ambos tiempos con minutos acumulados', () => {
      expect(allGaps(assignments)).toEqual([
        { period: 1, start: 0, end: 10 }, { period: 1, start: 25, end: 40 }, { period: 2, start: 60, end: 80 }
      ]);
    });

    it('gapAtMinute devuelve el hueco que contiene el minuto', () => {
      expect(gapAtMinute(assignments, 3)).toEqual({ period: 1, start: 0, end: 10 });
      expect(gapAtMinute(assignments, 25)).toEqual({ period: 1, start: 25, end: 40 });
      expect(gapAtMinute(assignments, 79)).toEqual({ period: 2, start: 60, end: 80 });
    });

    it('F2-S1. gapAtMinute es null sobre un tramo existente (inicio incluido, fin excluido)', () => {
      expect(gapAtMinute(assignments, 10)).toBeNull();
      expect(gapAtMinute(assignments, 24)).toBeNull();
      expect(gapAtMinute(assignments, 45)).toBeNull();
    });

    it('sin tramos todo el partido son dos huecos, y con el partido completo no hay ninguno', () => {
      expect(allGaps([])).toEqual([{ period: 1, start: 0, end: 40 }, { period: 2, start: 40, end: 80 }]);
      expect(allGaps([zone('a', 1, 0, 40), zone('b', 2, 40, 80)])).toEqual([]);
    });

    it('gapsWithEventCount cuenta los eventos de cada hueco, incluido el tiempo añadido', () => {
      const events = [ev('x', 1, 5, null), ev('y', 1, 30, null), ev('z', 1, 43, null), ev('w', 2, 70, null), ev('v', 1, 12, { row: 2, col: 3 })];

      expect(gapsWithEventCount(assignments, events).map(g => g.eventCount)).toEqual([1, 2, 1]);
    });
  });

  describe('suggestNextRange', () => {
    const assignments = [zone('a', 1, 0, 5), zone('b', 1, 10, 25)];

    it('propone 5 minutos desde el primer hueco', () => {
      expect(suggestNextRange(assignments)).toEqual({ start: 5, end: 10 });
      expect(suggestNextRange([])).toEqual({ start: 0, end: 5 });
    });

    it('continúa en el hueco que arranca donde terminó el tramo anterior', () => {
      expect(suggestNextRange(assignments, 25)).toEqual({ start: 25, end: 30 });
    });

    it('si no hay hueco después, vuelve al primero; un hueco corto limita la duración', () => {
      expect(suggestNextRange([zone('a', 1, 0, 3), zone('b', 1, 8, 40), zone('c', 2, 40, 80)], 60)).toEqual({ start: 3, end: 8 });
    });

    it('pasa al 2T cuando el 1T está completo y devuelve null con el partido completo', () => {
      expect(suggestNextRange([zone('a', 1, 0, 40)])).toEqual({ start: 40, end: 45 });
      expect(suggestNextRange([zone('a', 1, 0, 40), zone('b', 2, 40, 80)])).toBeNull();
    });
  });

  describe('isOutsidePeriodFilter', () => {
    it('con "Todo" nada se atenúa; con 1T se atenúa el 2T y viceversa', () => {
      expect(isOutsidePeriodFilter(1, 'ALL')).toBeFalse();
      expect(isOutsidePeriodFilter(2, 1)).toBeTrue();
      expect(isOutsidePeriodFilter(1, 1)).toBeFalse();
      expect(isOutsidePeriodFilter(1, 2)).toBeTrue();
    });
  });
});
