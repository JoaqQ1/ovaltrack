import { HEAT_STEPS, heatLevel, heatMix } from './zone-heat';

describe('zone-heat', () => {
  it('los cortes coinciden con la leyenda 0 · 1–5 · 6–15 · 16–30 · 30+', () => {
    expect(HEAT_STEPS.map(step => step.label)).toEqual(['0', '1–5', '6–15', '16–30', '30+']);
    expect([0, 1, 5, 6, 15, 16, 30, 31, 118].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('un conteo inválido o negativo es nivel 0', () => {
    expect(heatLevel(-3)).toBe(0);
    expect(heatLevel(Number.NaN)).toBe(0);
  });

  it('la mezcla va del ámbar (niveles 1 y 2 más claros) al naranja del nivel 4', () => {
    expect([0, 1, 2, 3, 4].map(heatMix)).toEqual([0, 0, 1 / 3, 2 / 3, 1]);
  });
});
