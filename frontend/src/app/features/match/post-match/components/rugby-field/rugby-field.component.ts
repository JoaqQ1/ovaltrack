import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { ZONE_GRID_COLS, ZONE_GRID_ROWS, ZoneCellRef, ZoneCellSummary } from '../../../types/zone.types';

interface FieldColumn {
  label: string;
  meters: number;
  x: number;
  width: number;
}

interface FieldCell extends ZoneCellRef {
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  heat: number;
}

/**
 * Cancha reglamentaria en metros: ingoal 10 + (línea de gol → 22) 22 + (22 → mitad) 28, y simétrico.
 * Total 120 m de largo x 70 m de ancho; se dibuja a 10 px por metro.
 */
const COLUMN_METERS = [10, 22, 28, 28, 22, 10];
const COLUMN_LABELS = ['Ingoal', '22', 'Mitad', 'Mitad', '22', 'Ingoal'];
const PX_PER_METER = 10;
const FIELD_LENGTH_M = COLUMN_METERS.reduce((sum, m) => sum + m, 0);
const FIELD_WIDTH_M = 70;

/**
 * Cancha de rugby en SVG. Es presentacional: pinta los conteos que recibe y avisa qué celda se tocó.
 * La grilla 3x6 es una capa de interacción sobre el dibujo, no el dibujo mismo.
 */
@Component({
  selector: 'app-rugby-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rugby-field.component.html',
  styleUrl: './rugby-field.component.css'
})
export class RugbyFieldComponent {
  readonly cells = input<ZoneCellSummary[]>([]);
  readonly unzonedEventCount = input<number>(0);
  readonly selectedCell = input<ZoneCellRef | null>(null);
  /** Si es false las celdas no responden (lectura). */
  readonly selectable = input<boolean>(true);

  readonly cellSelected = output<ZoneCellRef>();

  readonly width = FIELD_LENGTH_M * PX_PER_METER;
  readonly height = FIELD_WIDTH_M * PX_PER_METER;
  readonly columns: FieldColumn[] = this.buildColumns();

  /** Posición X (px) de cada línea transversal de la cancha. */
  readonly goalLineLeft = this.columns[1].x;
  readonly goalLineRight = this.columns[5].x;
  readonly line22Left = this.columns[2].x;
  readonly line22Right = this.columns[4].x;
  readonly halfway = this.columns[3].x;
  readonly line10Left = this.halfway - 10 * PX_PER_METER;
  readonly line10Right = this.halfway + 10 * PX_PER_METER;
  readonly line5Offset = 5 * PX_PER_METER;
  readonly line15Offset = 15 * PX_PER_METER;
  readonly postHalfGap = (5.6 / 2) * PX_PER_METER;
  readonly stripes = Array.from({ length: FIELD_LENGTH_M / 10 }, (_, i) => i);

  readonly fieldCells = computed<FieldCell[]>(() => {
    const counts = new Map(this.cells().map(c => [`${c.row}-${c.col}`, c.eventCount]));
    const maxCount = Math.max(1, ...counts.values());
    const rowHeight = this.height / ZONE_GRID_ROWS;
    const result: FieldCell[] = [];

    for (let row = 1; row <= ZONE_GRID_ROWS; row++) {
      for (let col = 1; col <= ZONE_GRID_COLS; col++) {
        const column = this.columns[col - 1];
        const count = counts.get(`${row}-${col}`) ?? 0;
        result.push({
          row,
          col,
          x: column.x,
          y: (row - 1) * rowHeight,
          width: column.width,
          height: rowHeight,
          count,
          heat: count > 0 ? 0.12 + 0.28 * (count / maxCount) : 0
        });
      }
    }
    return result;
  });

  readonly isEmpty = computed(() => this.cells().length === 0);

  isSelected(cell: ZoneCellRef): boolean {
    const selected = this.selectedCell();
    return !!selected && selected.row === cell.row && selected.col === cell.col;
  }

  select(cell: ZoneCellRef): void {
    if (this.selectable()) {
      this.cellSelected.emit({ row: cell.row, col: cell.col });
    }
  }

  onKey(event: Event, cell: ZoneCellRef): void {
    event.preventDefault();
    this.select(cell);
  }

  ariaLabel(cell: FieldCell): string {
    const column = this.columns[cell.col - 1].label;
    const events = cell.count === 1 ? '1 evento' : `${cell.count} eventos`;
    return `Zona fila ${cell.row}, columna ${cell.col} (${column}): ${events}`;
  }

  private buildColumns(): FieldColumn[] {
    let x = 0;
    return COLUMN_METERS.map((meters, index) => {
      const width = meters * PX_PER_METER;
      const column = { label: COLUMN_LABELS[index], meters, x, width };
      x += width;
      return column;
    });
  }
}
