import { GAP_HINT_HEIGHT, GAP_ITEM_HEIGHT, GAP_ITEM_SPACING, gapCapacity, itemsThatFit, visibleWithOverflow } from './zone-gap-overflow';

const heightFor = (items: number): number => items * GAP_ITEM_HEIGHT + (items - 1) * GAP_ITEM_SPACING;

describe('zone-gap-overflow', () => {
  it('itemsThatFit cuenta solo ítems enteros', () => {
    expect(itemsThatFit(0)).toBe(0);
    expect(itemsThatFit(GAP_ITEM_HEIGHT - 1)).toBe(0);
    expect(itemsThatFit(heightFor(3))).toBe(3);
    expect(itemsThatFit(heightFor(3) + GAP_ITEM_SPACING + GAP_ITEM_HEIGHT - 1)).toBe(3);
  });

  it('gapCapacity lista todos si entran, sin reservar el aviso', () => {
    expect(gapCapacity(heightFor(5), 5)).toBe(5);
    expect(gapCapacity(heightFor(5), 2)).toBe(2);
    expect(gapCapacity(heightFor(5), 0)).toBe(0);
  });

  it('gapCapacity reserva el lugar del aviso cuando no entran todos', () => {
    const height = heightFor(5);
    const expected = itemsThatFit(height - GAP_HINT_HEIGHT);
    expect(expected).toBeLessThan(5);
    expect(gapCapacity(height, 10)).toBe(expected);
  });

  it('visibleWithOverflow cuenta los ocultos', () => {
    const result = visibleWithOverflow([1, 2, 3, 4, 5], 3);
    expect(result).toEqual({ visible: [1, 2, 3], hidden: 2 });
  });

  it('el hueco precargado que no entra ocupa el lugar del último visible', () => {
    const result = visibleWithOverflow([1, 2, 3, 4, 5], 3, n => n === 5);
    expect(result).toEqual({ visible: [1, 2, 5], hidden: 2 });
  });

  it('el hueco precargado que ya entra no cambia el orden', () => {
    expect(visibleWithOverflow([1, 2, 3, 4, 5], 3, n => n === 2).visible).toEqual([1, 2, 3]);
  });
});
