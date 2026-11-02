import { ZoneAssignmentResponse } from '../../types/zone.types';
import { rowStops, stepMinute, stepRow, stopAt } from './zone-nav';

describe('zone-nav', () => {
  const zone = (id: string, period: 1 | 2, startMinute: number, endMinute: number, col: number): ZoneAssignmentResponse =>
    ({ id, matchId: 'm', period, startMinute, endMinute, row: 2, col });

  // 1T: C4 en 10–20, C3 en 20–30; el resto del 1T y todo el 2T están libres
  const assignments = [zone('a', 1, 10, 20, 4), zone('b', 1, 20, 30, 3)];

  describe('rowStops', () => {
    it('incluye los tramos de la franja y todos los huecos, en orden de tiempo', () => {
      const stops = rowStops(assignments, 4);

      expect(stops.map(s => [s.kind, s.start, s.end])).toEqual([
        ['gap', 0, 10], ['block', 10, 20], ['gap', 30, 40], ['gap', 40, 80]
      ]);
    });

    it('el tiempo de un tramo de otra franja no es parada', () => {
      expect(stopAt(rowStops(assignments, 4), 25)).toBeNull();
      expect(stopAt(rowStops(assignments, 3), 25)?.kind).toBe('block');
    });
  });

  describe('stepMinute', () => {
    const stops = rowStops(assignments, 4);

    it('dentro de un hueco avanza y retrocede de a un minuto', () => {
      expect(stepMinute(stops, 3, 1)).toBe(4);
      expect(stepMinute(stops, 3, -1)).toBe(2);
    });

    it('al salir de un hueco salta al tramo vecino, por su inicio', () => {
      expect(stepMinute(stops, 9, 1)).toBe(10);
    });

    it('desde un tramo salta a la parada siguiente (saltando el tiempo de otras franjas)', () => {
      expect(stepMinute(stops, 14, 1)).toBe(30);
    });

    it('hacia atrás entra a un hueco por su último minuto y a un tramo por su inicio', () => {
      expect(stepMinute(stops, 10, -1)).toBe(9);
      expect(stepMinute(stops, 30, -1)).toBe(10);
    });

    it('desde un minuto ocupado por otra franja va a la parada más cercana en esa dirección', () => {
      expect(stepMinute(stops, 25, 1)).toBe(30);
      expect(stepMinute(stops, 25, -1)).toBe(10);
    });

    it('cruza el entretiempo entre dos huecos contiguos', () => {
      expect(stepMinute(stops, 39, 1)).toBe(40);
      expect(stepMinute(stops, 40, -1)).toBe(39);
    });

    it('en los extremos de la fila no se mueve', () => {
      expect(stepMinute(stops, 0, -1)).toBe(0);
      expect(stepMinute(stops, 79, 1)).toBe(79);
    });
  });

  describe('stepRow', () => {
    it('sube hacia el in-goal rival y baja hacia el propio, sin pasar de los extremos', () => {
      expect(stepRow(4, 1)).toBe(5);
      expect(stepRow(4, -1)).toBe(3);
      expect(stepRow(6, 1)).toBe(6);
      expect(stepRow(1, -1)).toBe(1);
    });
  });
});
