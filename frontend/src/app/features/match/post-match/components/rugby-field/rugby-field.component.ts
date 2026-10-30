import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { ZONE_GRID_COLS, ZONE_GRID_ROWS, ZoneCellRef, ZoneCellSummary } from '../../../types/zone.types';
import {
  ZONE_COLUMN_METERS, ZONE_COLUMN_NAMES, ZONE_FIELD_LENGTH_M, ZONE_FIELD_WIDTH_M, ZONE_ROW_METERS,
  ZONE_ROW_LETTERS, ZONE_ROW_SHORT_NAMES, columnRangeLabel, describeZone, formatEventCount, rowRangeLabel, zoneLabel
} from '../../utils/zone-grid';

export type RugbyFieldMode = 'assign' | 'view';

interface FieldCell extends ZoneCellRef {
  label: string;
  count: number;
  countLabel: string;
  heat: number;
}

const PX_PER_METER = 10;

/**
 * Cancha de rugby: fondo SVG (solo dibujo) + grilla 3x6 de celdas HTML encima (interacción y accesibilidad).
 * Es presentacional: pinta lo que recibe y avisa qué celda se tocó. Vista relativa: siempre se ataca a la derecha.
 */
@Component({
  selector: 'app-rugby-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rugby-field.component.html',
  styleUrl: './rugby-field.component.css'
})
export class RugbyFieldComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly cells = input<ZoneCellSummary[]>([]);
  readonly unzonedEventCount = input<number>(0);
  readonly selectedCell = input<ZoneCellRef | null>(null);
  readonly ownClubName = input<string>('Mi club');
  /** 'assign' elige la zona de un tramo; 'view' solo lee (no modifica nada). */
  readonly mode = input<RugbyFieldMode>('assign');
  readonly selectable = input<boolean>(true);

  readonly cellSelected = output<ZoneCellRef>();

  // --- Geometría (todo sale de zone-grid) ---
  readonly width = ZONE_FIELD_LENGTH_M * PX_PER_METER;
  readonly height = ZONE_FIELD_WIDTH_M * PX_PER_METER;
  readonly columnTemplate = ZONE_COLUMN_METERS.map(m => `${m}fr`).join(' ');
  readonly rowMeters = ZONE_ROW_METERS;
  readonly rows = Array.from({ length: ZONE_GRID_ROWS }, (_, i) => i + 1);
  readonly cols = Array.from({ length: ZONE_GRID_COLS }, (_, i) => i + 1);
  readonly stripes = Array.from({ length: ZONE_FIELD_LENGTH_M / 10 }, (_, i) => i);

  /** Posición X (px del viewBox) de las líneas de la cancha. */
  readonly goalLineLeft = ZONE_COLUMN_METERS[0] * PX_PER_METER;
  readonly goalLineRight = this.width - ZONE_COLUMN_METERS[5] * PX_PER_METER;
  readonly line22Left = this.goalLineLeft + ZONE_COLUMN_METERS[1] * PX_PER_METER;
  readonly line22Right = this.goalLineRight - ZONE_COLUMN_METERS[4] * PX_PER_METER;
  readonly halfway = this.width / 2;
  readonly line10Left = this.halfway - 10 * PX_PER_METER;
  readonly line10Right = this.halfway + 10 * PX_PER_METER;
  /** Posición Y de las líneas de 5 y 15 m desde cada touch. */
  readonly line5Top = 5 * PX_PER_METER;
  readonly line5Bottom = this.height - 5 * PX_PER_METER;
  readonly line15Top = ZONE_ROW_METERS[0] * PX_PER_METER;
  readonly line15Bottom = this.height - ZONE_ROW_METERS[2] * PX_PER_METER;
  readonly postTop = this.height / 2 - 28;
  readonly postBottom = this.height / 2 + 28;

  // --- Ejes ---
  readonly columnAxis = this.cols.map(col => ({
    number: col,
    name: ZONE_COLUMN_NAMES[col - 1],
    range: columnRangeLabel(col) || 'in-goal',
    meters: ZONE_COLUMN_METERS[col - 1]
  }));
  readonly rowAxis = this.rows.map(row => ({ letter: ZONE_ROW_LETTERS[row - 1], name: ZONE_ROW_SHORT_NAMES[row - 1], range: rowRangeLabel(row), meters: ZONE_ROW_METERS[row - 1] }));
  readonly columnLegend = this.columnAxis.map(c => `${c.number} ${c.name.toLowerCase()}`).join(' · ');

  // --- Estado interno de foco/lectura ---
  private readonly activeCell = signal<ZoneCellRef | null>(null);
  private readonly focusCell = signal<ZoneCellRef | null>(null);

  readonly fieldRows = computed<FieldCell[][]>(() => {
    const counts = new Map(this.cells().map(c => [`${c.row}-${c.col}`, c.eventCount]));
    const maxCount = Math.max(1, ...counts.values());

    return this.rows.map(row => this.cols.map(col => {
      const count = counts.get(`${row}-${col}`) ?? 0;
      return { row, col, label: zoneLabel({ row, col }), count, countLabel: formatEventCount(count), heat: count > 0 ? count / maxCount : 0 };
    }));
  });

  readonly isEmpty = computed(() => this.cells().length === 0);

  readonly reading = computed(() => {
    const cell = this.activeCell();
    if (!cell) {
      return this.mode() === 'assign' ? 'Pasá el cursor o tocá una zona' : 'Tocá una zona para ver sus eventos';
    }
    const count = this.cells().find(c => c.row === cell.row && c.col === cell.col)?.eventCount ?? 0;
    const events = count === 1 ? '1 evento' : `${count} eventos`;
    return `${describeZone(cell)} · ${events}`;
  });

  readonly gridLabel = computed(() =>
    this.mode() === 'assign' ? 'Cancha: elegí la zona del tramo' : 'Cancha: tocá una zona para ver sus eventos');

  isSelected(cell: ZoneCellRef): boolean {
    const selected = this.selectedCell();
    return !!selected && selected.row === cell.row && selected.col === cell.col;
  }

  /** Tabindex móvil: solo una celda es parada de Tab; las demás se recorren con las flechas. */
  isTabStop(cell: ZoneCellRef): boolean {
    const stop = this.focusCell() ?? this.selectedCell() ?? { row: 1, col: 1 };
    return stop.row === cell.row && stop.col === cell.col;
  }

  select(cell: ZoneCellRef): void {
    if (this.selectable()) {
      this.cellSelected.emit({ row: cell.row, col: cell.col });
    }
  }

  onEnter(cell: ZoneCellRef): void {
    this.activeCell.set({ row: cell.row, col: cell.col });
  }

  onLeave(): void {
    this.activeCell.set(null);
  }

  onFocus(cell: ZoneCellRef): void {
    this.focusCell.set({ row: cell.row, col: cell.col });
    this.onEnter(cell);
  }

  onKeydown(event: KeyboardEvent, cell: ZoneCellRef): void {
    const target = this.nextCell(event.key, cell);
    if (target) {
      event.preventDefault();
      this.focusCell.set(target);
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-row="${target.row}"][data-col="${target.col}"]`)
        ?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(cell);
    }
  }

  ariaLabel(cell: FieldCell): string {
    const events = cell.count === 1 ? '1 evento' : `${cell.count} eventos`;
    return `${describeZone(cell)}: ${events}`;
  }

  private nextCell(key: string, cell: ZoneCellRef): ZoneCellRef | null {
    const clamp = (value: number, max: number) => Math.min(Math.max(value, 1), max);
    switch (key) {
      case 'ArrowRight': return { row: cell.row, col: clamp(cell.col + 1, ZONE_GRID_COLS) };
      case 'ArrowLeft': return { row: cell.row, col: clamp(cell.col - 1, ZONE_GRID_COLS) };
      case 'ArrowDown': return { row: clamp(cell.row + 1, ZONE_GRID_ROWS), col: cell.col };
      case 'ArrowUp': return { row: clamp(cell.row - 1, ZONE_GRID_ROWS), col: cell.col };
      case 'Home': return { row: cell.row, col: 1 };
      case 'End': return { row: cell.row, col: ZONE_GRID_COLS };
      default: return null;
    }
  }
}
