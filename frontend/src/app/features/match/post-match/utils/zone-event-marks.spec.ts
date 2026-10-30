import { MarkEvent, buildEventMarks, eventMarkKind } from './zone-event-marks';

describe('zone-event-marks', () => {
  const event = (id: string, period: number, seconds: number, name = 'Tackle completado', player: string | null = null): MarkEvent =>
    ({ id, period, matchTime: seconds, eventTypeName: name, playerName: player });

  describe('eventMarkKind', () => {
    it('distingue tries, tarjetas y patadas por la forma, el resto es "other"', () => {
      expect(eventMarkKind('Try')).toBe('try');
      expect(eventMarkKind('Try penal')).toBe('try');
      expect(eventMarkKind('Tarjeta Amarilla')).toBe('card');
      expect(eventMarkKind('Tarjeta Roja / Expulsión')).toBe('card');
      expect(eventMarkKind('Conversión')).toBe('kick');
      expect(eventMarkKind('Kick H (Penal a palos)')).toBe('kick');
      expect(eventMarkKind('Tackle completado')).toBe('other');
    });
  });

  describe('buildEventMarks', () => {
    it('sin eventos no hay marcas', () => {
      expect(buildEventMarks([])).toEqual([]);
    });

    it('una marca por evento en su minuto, ordenadas', () => {
      const marks = buildEventMarks([event('b', 1, 30 * 60), event('a', 1, 5 * 60)]);

      expect(marks.map(m => [m.period, m.minute, m.count])).toEqual([[1, 5, 1], [1, 30, 1]]);
    });

    it('agrupa los eventos del mismo minuto en una sola marca para que no se superpongan', () => {
      const marks = buildEventMarks([event('a', 1, 12 * 60 + 5), event('b', 1, 12 * 60 + 50), event('c', 1, 12 * 60 + 59)]);

      expect(marks.length).toBe(1);
      expect(marks[0].count).toBe(3);
    });

    it('el 2T usa minutos acumulados y no se mezcla con el mismo minuto del 1T', () => {
      const marks = buildEventMarks([event('a', 1, 10 * 60), event('b', 2, 50 * 60)]);

      expect(marks.map(m => [m.period, m.minute])).toEqual([[1, 10], [2, 50]]);
    });

    it('el tiempo añadido se apila en el borde 40 / 80 con su "+N"', () => {
      const marks = buildEventMarks([
        event('a', 1, 40 * 60),
        event('b', 1, 42 * 60),
        event('c', 1, 44 * 60),
        event('d', 2, 83 * 60)
      ]);

      expect(marks.map(m => [m.period, m.minute, m.count, m.addedCount])).toEqual([[1, 40, 3, 2], [2, 80, 1, 1]]);
      expect(marks[0].tooltip).toContain('2 de tiempo añadido');
    });

    it('el tipo de la marca prioriza try sobre tarjeta, patada y el resto', () => {
      const marks = buildEventMarks([event('a', 1, 600, 'Tackle completado'), event('b', 1, 601, 'Try'), event('c', 1, 602, 'Tarjeta Amarilla')]);

      expect(marks[0].kind).toBe('try');
    });

    it('el tooltip incluye minuto, tipo y jugador', () => {
      const [mark] = buildEventMarks([event('a', 1, 25 * 60, 'Try', 'J. Pérez')]);

      expect(mark.tooltip).toBe('25′\nTry · J. Pérez');
      expect(mark.ariaLabel).toContain('Try · J. Pérez');
    });

    it('ignora eventos con tiempo inválido o de un tiempo inexistente sin lanzar', () => {
      const marks = buildEventMarks([event('a', 1, -5), event('b', 3, 600), event('c', 1, Number.NaN)]);

      expect(marks).toEqual([]);
    });
  });
});
