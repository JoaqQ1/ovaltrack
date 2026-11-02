import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ZoneCellRef } from '../../../types/zone.types';
import { ZONE_COLUMN_METERS, ZONE_FIELD_LENGTH_M, ZONE_FIELD_WIDTH_M, ZONE_ROW_METERS } from '../../utils/zone-grid';

interface MiniCell {
  x: number;
  y: number;
  width: number;
  height: number;
  isIngoal: boolean;
  isActive: boolean;
}

/**
 * Cancha 3×6 en miniatura con la zona marcada, solo para mostrar (Eventos). Es decorativa: el nombre de la zona va
 * en el texto, el tooltip y el `aria-label` de quien la usa. Siempre se ataca hacia la derecha, como en Zonas.
 */
@Component({
  selector: 'app-zone-mini-map',
  standalone: true,
  imports: [NgFor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zone-mini-map.component.html',
  styleUrl: './zone-mini-map.component.css'
})
export class ZoneMiniMapComponent {
  /** Zona a marcar; null dibuja la cancha sin marca (evento sin zona). */
  readonly cell = input<ZoneCellRef | null>(null);

  readonly viewBox = `0 0 ${ZONE_FIELD_LENGTH_M} ${ZONE_FIELD_WIDTH_M}`;

  readonly cells = computed<MiniCell[]>(() => {
    const active = this.cell();
    const cells: MiniCell[] = [];
    let y = 0;
    ZONE_ROW_METERS.forEach((rowMeters, rowIndex) => {
      let x = 0;
      ZONE_COLUMN_METERS.forEach((colMeters, colIndex) => {
        cells.push({
          x, y, width: colMeters, height: rowMeters,
          isIngoal: colIndex === 0 || colIndex === ZONE_COLUMN_METERS.length - 1,
          isActive: active?.row === rowIndex + 1 && active?.col === colIndex + 1
        });
        x += colMeters;
      });
      y += rowMeters;
    });
    return cells;
  });
}
