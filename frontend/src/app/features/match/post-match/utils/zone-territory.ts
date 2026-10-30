import { ZONE_GRID_COLS } from '../../types/zone.types';

export type TerritorySide = 'own' | 'rival';

export interface Territory {
  side: TerritorySide;
  /** Intensidad 0–1: máxima en los in-goals, mínima en la mitad de la cancha. */
  weight: number;
}

/**
 * Lectura de territorio de una columna de la cancha: campo propio (columnas 1–3) o campo rival (4–6).
 * La escala es divergente, simétrica respecto de la mitad: 1 y 6 → 1,0 · 2 y 5 → 0,6 · 3 y 4 → 0,2.
 */
export function territoryOfColumn(col: number): Territory {
  const clamped = Math.min(Math.max(col, 1), ZONE_GRID_COLS);
  const position = (clamped - 1) / (ZONE_GRID_COLS - 1);
  return {
    side: clamped <= ZONE_GRID_COLS / 2 ? 'own' : 'rival',
    weight: Math.round(Math.abs(position * 2 - 1) * 10) / 10
  };
}
