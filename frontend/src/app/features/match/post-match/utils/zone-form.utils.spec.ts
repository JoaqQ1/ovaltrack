import { ZONE_HALF_MINUTES, ZoneAssignmentResponse } from '../../types/zone.types';
import { HALFTIME_SPLIT_MESSAGE, deduceZonePeriod, rangeCrossesHalftime, validateZoneForm, ZoneFormValues } from './zone-form.utils';
import { describeSegment, findOverlap } from './zone-stats';
import { TRACK_MINUTES } from './zone-track-layout';

describe('zone-form.utils', () => {
  const valid: ZoneFormValues = { period: 1, startMinute: 10, endMinute: 25, row: 2, col: 3 };

  describe('validateZoneForm', () => {
    it('acepta un formulario válido del 1T y del 2T', () => {
      expect(validateZoneForm(valid)).toBeNull();
      expect(validateZoneForm({ ...valid, period: 2, startMinute: 40, endMinute: 80 })).toBeNull();
    });

    it('acepta rangos contiguos al límite del tiempo', () => {
      expect(validateZoneForm({ ...valid, startMinute: 0, endMinute: 40 })).toBeNull();
    });

    it('exige elegir una celda', () => {
      expect(validateZoneForm({ ...valid, row: null, col: null })).toContain('celda');
    });

    it('rechaza celdas fuera de la grilla 3x6', () => {
      expect(validateZoneForm({ ...valid, row: 0 })).toContain('grilla');
      expect(validateZoneForm({ ...valid, row: 4 })).toContain('grilla');
      expect(validateZoneForm({ ...valid, col: 0 })).toContain('grilla');
      expect(validateZoneForm({ ...valid, col: 7 })).toContain('grilla');
    });

    it('rechaza minutos vacíos o no enteros', () => {
      expect(validateZoneForm({ ...valid, startMinute: null })).toContain('enteros');
      expect(validateZoneForm({ ...valid, endMinute: null })).toContain('enteros');
      expect(validateZoneForm({ ...valid, startMinute: 10.5 })).toContain('enteros');
    });

    it('rechaza inicio mayor o igual que el fin', () => {
      expect(validateZoneForm({ ...valid, startMinute: 20, endMinute: 10 })).toContain('menor');
      expect(validateZoneForm({ ...valid, startMinute: 10, endMinute: 10 })).toContain('menor');
    });

    it('rechaza minutos fuera del rango del período', () => {
      expect(validateZoneForm({ ...valid, startMinute: -5, endMinute: 10 })).toContain('1° tiempo');
      expect(validateZoneForm({ ...valid, startMinute: 30, endMinute: 45 })).toContain('1° tiempo');
      expect(validateZoneForm({ ...valid, period: 2, startMinute: 30, endMinute: 50 })).toContain('2° tiempo');
      expect(validateZoneForm({ ...valid, period: 2, startMinute: 60, endMinute: 85 })).toContain('2° tiempo');
    });
  });

  describe('deduceZonePeriod', () => {
    it('deduce el 1T o el 2T según el minuto de inicio', () => {
      expect(deduceZonePeriod(0, 5)).toBe(1);
      expect(deduceZonePeriod(35, 40)).toBe(1);
      expect(deduceZonePeriod(40, 45)).toBe(2);
      expect(deduceZonePeriod(75, 80)).toBe(2);
    });

    it('devuelve null si el rango cruza el entretiempo', () => {
      expect(deduceZonePeriod(38, 43)).toBeNull();
    });

    it('devuelve null si el rango está incompleto, no es entero o no avanza', () => {
      expect(deduceZonePeriod(null, 5)).toBeNull();
      expect(deduceZonePeriod(5, null)).toBeNull();
      expect(deduceZonePeriod(1.5, 5)).toBeNull();
      expect(deduceZonePeriod(10, 10)).toBeNull();
      expect(deduceZonePeriod(12, 10)).toBeNull();
    });
  });

  describe('rangeCrossesHalftime', () => {
    it('termina justo en el 40 o empieza justo en el 40: no cruza', () => {
      expect(rangeCrossesHalftime(30, 40)).toBeFalse();
      expect(rangeCrossesHalftime(40, 50)).toBeFalse();
    });

    it('empieza antes y termina después del 40: cruza', () => {
      expect(rangeCrossesHalftime(39, 41)).toBeTrue();
    });
  });

  /**
   * Caracterización (C0.2) del getter `rangeProblem` de ZoneAssignmentPanelComponent (:179-198), que no se puede ejecutar
   * en Node. `panelRangeProblem` es una COPIA de su lógica: fija el orden de las reglas y los mensajes actuales para que
   * 11g (`validateZoneRange`) los preserve. Cuando 11g exista, estos casos pasan a llamarla directamente.
   */
  describe('rangeProblem del panel (copia de :179-198)', () => {
    const zone = (id: string, period: 1 | 2, startMinute: number, endMinute: number): ZoneAssignmentResponse =>
      ({ id, matchId: 'm', period, startMinute, endMinute, row: 2, col: 3 });

    const panelRangeProblem = (
      startMinute: number | null, endMinute: number | null, assignments: ZoneAssignmentResponse[] = [], editingId: string | null = null
    ): string | null => {
      if (startMinute !== null && endMinute !== null && Number.isInteger(startMinute) && Number.isInteger(endMinute)
          && startMinute < endMinute && rangeCrossesHalftime(startMinute, endMinute)) {
        return HALFTIME_SPLIT_MESSAGE;
      }

      const formError = validateZoneForm({
        period: (startMinute ?? 0) >= ZONE_HALF_MINUTES ? 2 : 1, startMinute, endMinute, row: 1, col: 1
      });
      if (formError) return formError;

      const period = deduceZonePeriod(startMinute, endMinute);
      const usable = period !== null && startMinute !== null && endMinute !== null && startMinute >= 0 && endMinute <= TRACK_MINUTES
        ? { period, startMinute, endMinute }
        : null;
      const clash = usable ? findOverlap(usable, assignments, editingId) : null;
      return clash ? `Choca con el tramo ${describeSegment(clash)}.` : null;
    };

    it('un rango que cruza el entretiempo devuelve el aviso de partirlo, aunque además se pase de los límites', () => {
      expect(panelRangeProblem(30, 45)).toBe(HALFTIME_SPLIT_MESSAGE);
      expect(panelRangeProblem(39, 41)).toBe(HALFTIME_SPLIT_MESSAGE);
      expect(panelRangeProblem(-5, 45)).toBe(HALFTIME_SPLIT_MESSAGE);
      expect(panelRangeProblem(30, 85)).toBe(HALFTIME_SPLIT_MESSAGE);
    });

    it('los rangos que terminan o empiezan justo en el 40 y los tiempos completos son válidos', () => {
      expect(panelRangeProblem(30, 40)).toBeNull();
      expect(panelRangeProblem(40, 45)).toBeNull();
      expect(panelRangeProblem(0, 40)).toBeNull();
      expect(panelRangeProblem(40, 80)).toBeNull();
    });

    it('minutos vacíos o no enteros: pide minutos enteros (el cruce no se evalúa)', () => {
      expect(panelRangeProblem(null, 10)).toBe('Ingresá minutos enteros de inicio y fin');
      expect(panelRangeProblem(10, null)).toBe('Ingresá minutos enteros de inicio y fin');
      expect(panelRangeProblem(10.5, 20)).toBe('Ingresá minutos enteros de inicio y fin');
    });

    it('inicio mayor o igual al fin: el mensaje es el del orden, también cuando el inicio está en el 2T', () => {
      expect(panelRangeProblem(20, 10)).toBe('El minuto de inicio debe ser menor al minuto de fin');
      expect(panelRangeProblem(10, 10)).toBe('El minuto de inicio debe ser menor al minuto de fin');
      expect(panelRangeProblem(45, 38)).toBe('El minuto de inicio debe ser menor al minuto de fin');
    });

    it('el tiempo se deduce solo del inicio: los límites que se nombran son los de ese tiempo', () => {
      expect(panelRangeProblem(-5, 10)).toBe('El 1° tiempo va del minuto 0 al 40');
      expect(panelRangeProblem(70, 85)).toBe('El 2° tiempo va del minuto 40 al 80');
      expect(panelRangeProblem(80, 85)).toBe('El 2° tiempo va del minuto 40 al 80');
    });

    it('un choque nombra el tramo con el que se pisa', () => {
      const zones = [zone('a', 1, 10, 25)];
      expect(panelRangeProblem(20, 30, zones)).toBe("Choca con el tramo 1T 10'–25' (C3).");
      expect(panelRangeProblem(5, 15, zones)).toBe("Choca con el tramo 1T 10'–25' (C3).");
    });

    it('rangos contiguos, del otro tiempo o el propio tramo en edición no chocan', () => {
      const zones = [zone('a', 1, 10, 25)];
      expect(panelRangeProblem(25, 30, zones)).toBeNull();
      expect(panelRangeProblem(0, 10, zones)).toBeNull();
      expect(panelRangeProblem(40, 60, zones)).toBeNull();
      expect(panelRangeProblem(10, 25, zones, 'a')).toBeNull();
    });

    it('el error del formulario se informa antes que el choque', () => {
      expect(panelRangeProblem(-5, 10, [zone('a', 1, 0, 5)])).toBe('El 1° tiempo va del minuto 0 al 40');
    });
  });
});
