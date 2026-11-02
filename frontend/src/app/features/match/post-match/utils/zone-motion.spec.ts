import { ZONE_MOTION_MS, tweenValue } from './zone-motion';

describe('zone-motion', () => {
  it('las microinteracciones duran como máximo 250 ms', () => {
    expect(ZONE_MOTION_MS).toBeLessThanOrEqual(250);
  });

  describe('tweenValue', () => {
    it('arranca en el valor anterior y termina en el nuevo', () => {
      expect(tweenValue(4, 9, 0)).toBe(4);
      expect(tweenValue(4, 9, 1)).toBe(9);
    });

    it('avanza sin pasarse del destino y desacelera hacia el final', () => {
      const half = tweenValue(0, 100, 0.5);

      expect(half).toBeGreaterThan(50);
      expect(half).toBeLessThan(100);
    });

    it('también anima hacia abajo y limita el avance fuera de 0–1', () => {
      expect(tweenValue(10, 2, 1)).toBe(2);
      expect(tweenValue(10, 2, 5)).toBe(2);
      expect(tweenValue(10, 2, -1)).toBe(10);
    });
  });
});
