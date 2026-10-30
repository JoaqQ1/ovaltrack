import { WCAG_AA_TEXT_CONTRAST, blend, contrastRatio, hexToRgb } from './color-contrast';

describe('color-contrast', () => {
  const white = hexToRgb('#ffffff');

  it('blanco sobre negro es 21:1 y un color sobre sí mismo es 1:1', () => {
    expect(contrastRatio(white, hexToRgb('#000000'))).toBeCloseTo(21, 1);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
  });

  /**
   * Mismos valores que rugby-field.component.css: césped = mezcla del verde de marca con #a8d5a2,
   * calor = escala --zone-heat-low/high al 62 %, y la etiqueta I1…D6 sobre un chip de --text-primary al 78 %.
   */
  describe('etiquetas I1…D6 de la cancha', () => {
    const brand = hexToRgb('#204b22');
    const lightGrass = hexToRgb('#a8d5a2');
    const grass = [
      blend(brand, 0.58, lightGrass), // franja clara
      blend(brand, 0.66, lightGrass), // franja oscura
      blend(brand, 0.82, lightGrass)  // in-goal
    ];
    const heatLow = hexToRgb('#fdb022');
    const heatHigh = hexToRgb('#d9480f');
    const heated = grass.flatMap(base =>
      [0, 0.5, 1].map(t => blend(blend(heatHigh, t, heatLow), 0.62, base)));
    const textPrimary = hexToRgb('#111d0e');

    it('el texto blanco directo sobre el ámbar no cumple 4.5:1 (por eso las etiquetas llevan chip)', () => {
      expect(contrastRatio(white, heated[0])).toBeLessThan(WCAG_AA_TEXT_CONTRAST);
    });

    it('con el chip oscuro cumplen 4.5:1 sobre cualquier fondo de la cancha, con o sin calor', () => {
      for (const background of [...grass, ...heated]) {
        const chip = blend(textPrimary, 0.78, background);

        expect(contrastRatio(white, chip)).toBeGreaterThanOrEqual(WCAG_AA_TEXT_CONTRAST);
      }
    });
  });
});
