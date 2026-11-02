import { OverflowMetrics, itemsThatFit, overflowCapacity, visibleWithOverflow } from './list-overflow';

describe('list-overflow', () => {
  // Huecos sin zona: ítems de 44px, 8px de separación, aviso de 28px
  const gaps: OverflowMetrics = { itemHeight: 44, itemSpacing: 8, hintHeight: 28 };
  // Cola de revisión: ítems de 34px, 5px de separación, aviso de 26px
  const queue: OverflowMetrics = { itemHeight: 34, itemSpacing: 5, hintHeight: 26 };
  const heightFor = (items: number, m: OverflowMetrics): number => items * m.itemHeight + (items - 1) * m.itemSpacing;

  describe('itemsThatFit', () => {
    it('cuenta solo ítems enteros', () => {
      expect(itemsThatFit(0, gaps)).toBe(0);
      expect(itemsThatFit(gaps.itemHeight - 1, gaps)).toBe(0);
      expect(itemsThatFit(heightFor(3, gaps), gaps)).toBe(3);
      expect(itemsThatFit(heightFor(3, gaps) + gaps.itemSpacing + gaps.itemHeight - 1, gaps)).toBe(3);
    });

    it('usa las métricas de cada lista', () => {
      expect(itemsThatFit(heightFor(4, queue), queue)).toBe(4);
      expect(itemsThatFit(heightFor(4, queue) - 1, queue)).toBe(3);
    });
  });

  describe('overflowCapacity', () => {
    it('lista todos si entran, sin reservar el aviso', () => {
      expect(overflowCapacity(heightFor(5, gaps), 5, gaps)).toBe(5);
      expect(overflowCapacity(heightFor(5, gaps), 2, gaps)).toBe(2);
      expect(overflowCapacity(heightFor(5, gaps), 0, gaps)).toBe(0);
    });

    it('reserva el lugar del aviso cuando no entran todos', () => {
      const height = heightFor(5, gaps);
      const expected = itemsThatFit(height - gaps.hintHeight, gaps);
      expect(expected).toBeLessThan(5);
      expect(overflowCapacity(height, 10, gaps)).toBe(expected);
    });

    it('con el aviso incluido, lo listado más el aviso nunca supera el alto', () => {
      for (let height = 0; height <= 400; height += 7) {
        const capacity = overflowCapacity(height, 20, queue);
        const used = capacity > 0 ? heightFor(capacity, queue) + queue.hintHeight : queue.hintHeight;
        expect(used).toBeLessThanOrEqual(Math.max(height, queue.hintHeight));
      }
    });

    it('respeta el mínimo de ítems aunque no entren, sin pasar del total', () => {
      expect(overflowCapacity(10, 20, queue, 2)).toBe(2);
      expect(overflowCapacity(10, 1, queue, 2)).toBe(1);
      expect(overflowCapacity(heightFor(6, queue), 20, queue, 2)).toBe(itemsThatFit(heightFor(6, queue) - queue.hintHeight, queue));
    });
  });

  describe('visibleWithOverflow', () => {
    it('cuenta los ocultos', () => {
      expect(visibleWithOverflow([1, 2, 3, 4, 5], 3)).toEqual({ visible: [1, 2, 3], hidden: 2 });
    });

    it('el ítem marcado que no entra ocupa el lugar del último visible', () => {
      expect(visibleWithOverflow([1, 2, 3, 4, 5], 3, n => n === 5)).toEqual({ visible: [1, 2, 5], hidden: 2 });
    });

    it('el ítem marcado que ya entra no cambia el orden', () => {
      expect(visibleWithOverflow([1, 2, 3, 4, 5], 3, n => n === 2).visible).toEqual([1, 2, 3]);
    });
  });
});
