import { ZoneCellRef } from '../../types/zone.types';
import { ZONE_ROW_NAMES } from './zone-grid';

/** Teclas por fila (izquierda, centro, derecha); la posición en cada fila es la columna 1…6 de la cancha. */
export const ZONE_SHORTCUT_ROWS: readonly (readonly string[])[] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y'],
  ['A', 'S', 'D', 'F', 'G', 'H'],
  ['Z', 'X', 'C', 'V', 'B', 'N']
];

export interface ShortcutHelpRow {
  rowName: string;
  keys: string;
}

/** Filas de la ayuda de atajos, ej. "Izquierda: Q W E R T Y". */
export const ZONE_SHORTCUT_HELP: readonly ShortcutHelpRow[] = ZONE_SHORTCUT_ROWS.map((keys, i) => ({
  rowName: ZONE_ROW_NAMES[i],
  keys: keys.join(' ')
}));

/** Celda que corresponde a una tecla (sin distinguir mayúsculas), o null si no es un atajo de la grilla. */
export function shortcutCell(key: string): ZoneCellRef | null {
  const upper = key.toUpperCase();
  for (let row = 0; row < ZONE_SHORTCUT_ROWS.length; row++) {
    const col = ZONE_SHORTCUT_ROWS[row].indexOf(upper);
    if (col >= 0) return { row: row + 1, col: col + 1 };
  }
  return null;
}

/** Con el foco en un campo de escritura los atajos de letras no deben hacer nada. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!element) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName?.toUpperCase() ?? '') || element.isContentEditable === true;
}

/** Ctrl/Cmd + Enter guarda el tramo. */
export function isSaveShortcut(event: { key: string; ctrlKey: boolean; metaKey: boolean }): boolean {
  return event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}
