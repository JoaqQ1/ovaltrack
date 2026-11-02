/** Alto de cada hueco de la lista (fijado en el CSS del panel) y separación entre ellos, en px. */
export const GAP_ITEM_HEIGHT = 44;
export const GAP_ITEM_SPACING = 8;

/** Alto del aviso "+N más en la grilla" al pie (fijado en el CSS del panel), en px. */
export const GAP_HINT_HEIGHT = 28;

/** Sin alto acotado (una columna, hoja móvil) no hay qué medir: se listan estos huecos y el resto va a la grilla. */
export const GAPS_UNBOUNDED_PREVIEW = 4;

export interface GapOverflow<T> {
  visible: T[];
  hidden: number;
}

/** Cuántos ítems enteros entran en `height` px. */
export function itemsThatFit(height: number): number {
  return Math.max(0, Math.floor((height + GAP_ITEM_SPACING) / (GAP_ITEM_HEIGHT + GAP_ITEM_SPACING)));
}

/** Cuántos huecos se listan en `height` px: todos si entran; si no, los que entran dejando lugar al aviso del pie. */
export function gapCapacity(height: number, total: number): number {
  return itemsThatFit(height) >= total ? total : itemsThatFit(height - GAP_HINT_HEIGHT);
}

/**
 * Los primeros `capacity` huecos en orden cronológico. Si el hueco precargado en el formulario no entra, ocupa el lugar
 * del último visible para que el ítem resaltado nunca quede oculto.
 */
export function visibleWithOverflow<T>(items: readonly T[], capacity: number, pinned?: (item: T) => boolean): GapOverflow<T> {
  const visible = items.slice(0, capacity);
  const loaded = pinned ? items.find(pinned) : undefined;
  if (loaded !== undefined && visible.length > 0 && !visible.includes(loaded)) visible[visible.length - 1] = loaded;
  return { visible, hidden: items.length - visible.length };
}
