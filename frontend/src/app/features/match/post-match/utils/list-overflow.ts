/**
 * Lista que muestra solo los ítems que entran completos en el alto libre y resume el resto en un aviso al pie
 * («+N más …»), sin scroll interno ni ítems cortados. La usan «Huecos sin zona» (Zonas) y la cola de revisión (Eventos).
 */

/** Alturas fijas (px) de la lista: cada ítem, la separación entre ítems y el aviso al pie. Salen del CSS de cada lista. */
export interface OverflowMetrics {
  itemHeight: number;
  itemSpacing: number;
  hintHeight: number;
}

export interface ListOverflow<T> {
  visible: T[];
  hidden: number;
}

/** Cuántos ítems enteros entran en `height` px. */
export function itemsThatFit(height: number, metrics: OverflowMetrics): number {
  return Math.max(0, Math.floor((height + metrics.itemSpacing) / (metrics.itemHeight + metrics.itemSpacing)));
}

/**
 * Cuántos ítems se listan en `height` px: todos si entran; si no, los que entran dejando lugar al aviso del pie, y
 * nunca menos de `minItems` (la lista reserva ese lugar en el CSS).
 */
export function overflowCapacity(height: number, total: number, metrics: OverflowMetrics, minItems = 0): number {
  const fit = itemsThatFit(height, metrics) >= total ? total : itemsThatFit(height - metrics.hintHeight, metrics);
  return Math.min(total, Math.max(fit, minItems));
}

/**
 * Los primeros `capacity` ítems en orden. Si el ítem marcado (`pinned`) no entra, ocupa el lugar del último visible
 * para que el resaltado nunca quede oculto.
 */
export function visibleWithOverflow<T>(items: readonly T[], capacity: number, pinned?: (item: T) => boolean): ListOverflow<T> {
  const visible = items.slice(0, capacity);
  const marked = pinned ? items.find(pinned) : undefined;
  if (marked !== undefined && visible.length > 0 && !visible.includes(marked)) visible[visible.length - 1] = marked;
  return { visible, hidden: items.length - visible.length };
}
