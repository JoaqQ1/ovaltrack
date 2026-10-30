import {
  ZoneEvent, NO_ZONE_EVENT_FILTERS, coverageMinutes, effectiveMatchTime, filterEvents, nextGap, countByCell, describeSegment, eventsInCell, eventsInRange, eventsReleasedByEdit,
  findGaps, findOverlap, periodRange, sortChronologically, suggestRange, unzonedEvents
} from './zone-stats';
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

  describe('effectiveMatchTime', () => {
    it('no modifica los segundos dentro del tiempo reglamentario', () => {
      expect(effectiveMatchTime(1, 39 * 60)).toBe(39 * 60);
      expect(effectiveMatchTime(2, 50 * 60)).toBe(50 * 60);
    });

    it('limita el tiempo añadido al último segundo del 1T (39:59) y del 2T (79:59)', () => {
      expect(effectiveMatchTime(1, 40 * 60)).toBe(40 * 60 - 1);
      expect(effectiveMatchTime(1, 43 * 60)).toBe(40 * 60 - 1);
      expect(effectiveMatchTime(2, 84 * 60)).toBe(80 * 60 - 1);
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

  describe('eventos por zona', () => {
    const event = (id: string, period: 1 | 2, minute: number, zone: { row: number; col: number } | null = null): ZoneEvent =>
      ({ id, period, matchTime: minute * 60, zone });

    const events = [
      event('a', 1, 12, { row: 2, col: 3 }),
      event('b', 1, 18, { row: 2, col: 3 }),
      event('c', 1, 35),
      event('d', 2, 50, { row: 3, col: 6 }),
      event('e', 2, 70)
    ];

    it('cuenta eventos por celda sin incluir los eventos sin zona', () => {
      expect(countByCell(events, 'ALL')).toEqual([
        { row: 2, col: 3, eventCount: 2 },
        { row: 3, col: 6, eventCount: 1 }
      ]);
    });

    it('el filtro de tiempo limita los conteos', () => {
      expect(countByCell(events, 1)).toEqual([{ row: 2, col: 3, eventCount: 2 }]);
      expect(countByCell(events, 2)).toEqual([{ row: 3, col: 6, eventCount: 1 }]);
    });

    it('devuelve los eventos sin zona ordenados y respetando el filtro', () => {
      expect(unzonedEvents(events, 'ALL').map(e => e.id)).toEqual(['c', 'e']);
      expect(unzonedEvents(events, 2).map(e => e.id)).toEqual(['e']);
    });

    it('devuelve los eventos de una celda', () => {
      expect(eventsInCell(events, { row: 2, col: 3 }, 'ALL').map(e => e.id)).toEqual(['a', 'b']);
      expect(eventsInCell(events, { row: 2, col: 3 }, 2)).toEqual([]);
    });

    it('sin eventos todo queda vacío', () => {
      expect(countByCell([], 'ALL')).toEqual([]);
      expect(unzonedEvents([], 'ALL')).toEqual([]);
    });

    it('ordena cronológicamente por tiempo y minuto', () => {
      const shuffled = [event('x', 2, 41), event('y', 1, 39), event('z', 1, 2)];

      expect(sortChronologically(shuffled).map(e => e.id)).toEqual(['z', 'y', 'x']);
    });

    describe('eventsInRange (misma regla que el backend)', () => {
      const boundary = [event('start', 1, 10), event('inside', 1, 15), event('end', 1, 25), event('other', 2, 15 + 40)];

      it('incluye el inicio y excluye el fin', () => {
        const ids = eventsInRange({ period: 1, startMinute: 10, endMinute: 25 }, boundary).map(e => e.id);

        expect(ids).toEqual(['start', 'inside']);
      });

      it('no mezcla tiempos: el 2T usa minutos acumulados', () => {
        expect(eventsInRange({ period: 2, startMinute: 40, endMinute: 60 }, boundary).map(e => e.id)).toEqual(['other']);
        expect(eventsInRange({ period: 1, startMinute: 40, endMinute: 60 }, boundary)).toEqual([]);
      });

      it('un evento a los 25:00 exactos pertenece al tramo siguiente', () => {
        expect(eventsInRange({ period: 1, startMinute: 25, endMinute: 40 }, boundary).map(e => e.id)).toEqual(['end']);
      });

      describe('tiempo añadido', () => {
        const added = [event('min40', 1, 40), event('min43', 1, 43), event('min80', 2, 80), event('min84', 2, 84)];

        it('el 1T pasado del minuto 40 entra en el tramo que termina en 40', () => {
          const ids = eventsInRange({ period: 1, startMinute: 31, endMinute: 40 }, added).map(e => e.id);

          expect(ids).toEqual(['min40', 'min43']);
        });

        it('el 2T pasado del minuto 80 entra en el tramo que termina en 80', () => {
          const ids = eventsInRange({ period: 2, startMinute: 68, endMinute: 80 }, added).map(e => e.id);

          expect(ids).toEqual(['min80', 'min84']);
        });

        it('si el tramo no llega a 40 u 80 el tiempo añadido no entra', () => {
          expect(eventsInRange({ period: 1, startMinute: 31, endMinute: 38 }, added)).toEqual([]);
        });

        it('el tiempo añadido del 1T nunca cae en un tramo del 2T', () => {
          expect(eventsInRange({ period: 2, startMinute: 40, endMinute: 80 }, added).map(e => e.id)).toEqual(['min80', 'min84']);
        });
      });
    });

    describe('eventsReleasedByEdit', () => {
      it('informa los eventos que perderían la zona al reducir el tramo', () => {
        const released = eventsReleasedByEdit(
          { period: 1, startMinute: 10, endMinute: 25 },
          { period: 1, startMinute: 10, endMinute: 15 },
          events
        );

        expect(released.map(e => e.id)).toEqual(['b']);
      });

      it('ampliar el tramo no libera ningún evento', () => {
        expect(eventsReleasedByEdit(
          { period: 1, startMinute: 10, endMinute: 25 },
          { period: 1, startMinute: 5, endMinute: 30 },
          events
        )).toEqual([]);
      });
    });
  });

  describe('filterEvents', () => {
    const rows = [
      { id: 'a', eventTypeId: 't1', teamPossession: 'OWN' as const },
      { id: 'b', eventTypeId: 't1', teamPossession: 'OPPONENT' as const },
      { id: 'c', eventTypeId: 't2', teamPossession: 'OWN' as const }
    ];

    it('sin filtros devuelve todo', () => {
      expect(filterEvents(rows, NO_ZONE_EVENT_FILTERS).map(r => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('filtra por tipo, por posesión y por ambos a la vez', () => {
      expect(filterEvents(rows, { eventTypeId: 't1', possession: 'ALL' }).map(r => r.id)).toEqual(['a', 'b']);
      expect(filterEvents(rows, { eventTypeId: 'ALL', possession: 'OWN' }).map(r => r.id)).toEqual(['a', 'c']);
      expect(filterEvents(rows, { eventTypeId: 't1', possession: 'OWN' }).map(r => r.id)).toEqual(['a']);
    });

    it('un filtro sin coincidencias devuelve una lista vacía', () => {
      expect(filterEvents(rows, { eventTypeId: 'zzz', possession: 'ALL' })).toEqual([]);
    });
  });

  describe('coverageMinutes', () => {
    it('sin tramos no hay minutos con zona', () => {
      expect(coverageMinutes([], 1)).toBe(0);
      expect(coverageMinutes([], 2)).toBe(0);
    });

    it('suma los minutos de cada tiempo por separado', () => {
      const zones = [zone('a', 1, 0, 20), zone('b', 1, 25, 32), zone('c', 2, 40, 80)];

      expect(coverageMinutes(zones, 1)).toBe(27);
      expect(coverageMinutes(zones, 2)).toBe(40);
    });

    it('el tiempo completamente cubierto es 40', () => {
      expect(coverageMinutes([zone('a', 1, 0, 40)], 1)).toBe(40);
    });
  });

  describe('nextGap', () => {
    it('sin tramos el próximo hueco es todo el 1T', () => {
      expect(nextGap([], null)).toEqual({ period: 1, start: 0, end: 40 });
    });

    it('devuelve el primer hueco que arranca después del minuto indicado', () => {
      const zones = [zone('a', 1, 0, 10), zone('b', 1, 20, 30)];

      expect(nextGap(zones, 0)).toEqual({ period: 1, start: 10, end: 20 });
      expect(nextGap(zones, 10)).toEqual({ period: 1, start: 30, end: 40 });
    });

    it('pasa del 1T al 2T con minutos acumulados', () => {
      const zones = [zone('a', 1, 0, 40), zone('b', 2, 40, 55)];

      expect(nextGap(zones, 0)).toEqual({ period: 2, start: 55, end: 80 });
    });

    it('da la vuelta al principio cuando no queda ninguno después', () => {
      const zones = [zone('a', 1, 10, 40), zone('b', 2, 40, 80)];

      expect(nextGap(zones, 10)).toEqual({ period: 1, start: 0, end: 10 });
    });

    it('con el partido completo devuelve null', () => {
      expect(nextGap([zone('a', 1, 0, 40), zone('b', 2, 40, 80)], null)).toBeNull();
    });
  });
});
