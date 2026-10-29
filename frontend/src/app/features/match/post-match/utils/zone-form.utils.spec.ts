import { validateZoneForm, ZoneFormValues } from './zone-form.utils';

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
});
