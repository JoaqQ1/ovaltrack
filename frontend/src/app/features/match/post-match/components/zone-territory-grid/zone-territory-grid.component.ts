import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZoneCellRef, ZonePeriod } from '../../../types/zone.types';
import { zoneLabel } from '../../utils/zone-grid';
import { ZoneEvent, ZonePeriodFilter } from '../../utils/zone-stats';
import {
  PeriodGap, TRACK_MINUTES, allGaps, blockLabel, blockLayout, countByFranja, gapAtMinute, minuteAtOffset, minuteToPercent, territoryRows
} from '../../utils/zone-track-layout';

/** Tramo o hueco elegido en una fila de la grilla: `col` es la franja (fila de la grilla) sobre la que se hizo clic. */
export interface TerritoryGapSelection {
  period: ZonePeriod;
  startMinute: number;
  endMinute: number;
  col: number;
}

interface BlockView {
  assignment: ZoneAssignmentResponse;
  left: number;
  width: number;
  label: string;
  aria: string;
}

interface RowView {
  col: number;
  name: string;
  range: string;
  count: number;
  blocks: BlockView[];
}

interface Tick {
  minute: number;
  left: number;
  label: string;
}

const TICK_STEP = 10;

/**
 * Grilla de territorio en el tiempo: eje horizontal de 0' a 80' (igual al de Eventos) y una fila por franja de la
 * cancha, con el in-goal rival arriba. Cada tramo es un bloque en su fila; los huecos sin zona se ven rayados a lo
 * alto de toda la grilla. Presentacional: avisa qué se tocó y no guarda nada.
 */
@Component({
  selector: 'app-zone-territory-grid',
  standalone: true,
  templateUrl: './zone-territory-grid.component.html',
  styleUrl: './zone-territory-grid.component.css'
})
export class ZoneTerritoryGridComponent {
  readonly assignments = input<ZoneAssignmentResponse[]>([]);
  /** Eventos ya filtrados por posesión: sus conteos por franja aparecen en cada fila. */
  readonly events = input<ZoneEvent[]>([]);
  /** El tiempo elegido en los filtros: la otra mitad de la grilla se atenúa y los conteos solo cuentan este tiempo. */
  readonly periodFilter = input<ZonePeriodFilter>('ALL');
  /** Tramo que se está editando: su bloque lleva un anillo. */
  readonly selectedId = input<string | null>(null);
  /** Franja elegida en el formulario: su fila se resalta y el rango cargado se dibuja ahí. */
  readonly selectedCol = input<number | null>(null);
  /** Tramo que choca con el rango en edición. */
  readonly conflictId = input<string | null>(null);
  /** Celda bajo el cursor en la cancha: sus tramos se destacan y el resto se atenúa. */
  readonly highlightCell = input<ZoneCellRef | null>(null);
  /** Rango cargado en el formulario (minutos acumulados): se dibuja como vista previa. */
  readonly previewRange = input<{ period: ZonePeriod; startMinute: number; endMinute: number } | null>(null);

  readonly segmentSelected = output<ZoneAssignmentResponse>();
  /** Tramo bajo el cursor o el foco (null al salir): la cancha resalta su celda. */
  readonly segmentHover = output<string | null>();
  /** Clic en una fila dentro de un hueco: propone ese hueco y esa franja. */
  readonly gapSelected = output<TerritoryGapSelection>();

  private readonly tracks = viewChild<ElementRef<HTMLElement>>('tracks');

  readonly rowCount = territoryRows().length;
  readonly halfMark = minuteToPercent(ZONE_HALF_MINUTES);
  readonly ticks: Tick[] = Array.from({ length: TRACK_MINUTES / TICK_STEP + 1 }, (_, i) => i * TICK_STEP).map(minute => ({
    minute,
    left: minuteToPercent(minute),
    label: minute === 0 ? 'INICIO' : minute === ZONE_HALF_MINUTES ? 'E.T.' : minute === TRACK_MINUTES ? 'FIN' : `${minute}′`
  }));

  /** Hueco y franja bajo el puntero (null si está sobre un tramo o fuera de un hueco). */
  private readonly pointed = signal<{ col: number; gap: PeriodGap } | null>(null);

  readonly isEmpty = computed(() => this.assignments().length === 0);

  readonly rows = computed<RowView[]>(() => {
    const counts = countByFranja(this.events(), this.periodFilter());
    const blocks = this.assignments().map<BlockView>(assignment => ({
      assignment,
      ...blockLayout(assignment),
      label: blockLabel(assignment),
      aria: `Tramo ${assignment.period}T ${assignment.startMinute}′ a ${assignment.endMinute}′, zona ${zoneLabel(assignment)}. Tocá para editar`
    }));
    return territoryRows().map(row => ({
      ...row,
      count: counts.get(row.col) ?? 0,
      blocks: blocks.filter(block => block.assignment.col === row.col)
    }));
  });

  readonly gaps = computed(() => allGaps(this.assignments()).map(gap => ({ ...gap, ...blockLayout({ startMinute: gap.start, endMinute: gap.end }) })));

  /** Mitad que no está en el filtro de tiempo: se cubre con un velo. */
  readonly dimmedHalf = computed<'first' | 'second' | null>(() => {
    const filter = this.periodFilter();
    return filter === 'ALL' ? null : filter === 1 ? 'second' : 'first';
  });

  readonly hoverGap = computed(() => {
    const target = this.pointed();
    if (!target) return null;
    const rowIndex = this.rows().findIndex(row => row.col === target.col);
    return { rowIndex, ...blockLayout({ startMinute: target.gap.start, endMinute: target.gap.end }) };
  });

  /** Vista previa del formulario: en la fila de la franja elegida o, sin franja (`rowIndex` -1), como barra sobre el eje. */
  readonly preview = computed(() => {
    const range = this.previewRange();
    if (!range) return null;
    const rowIndex = this.rows().findIndex(row => row.col === this.selectedCol());
    return {
      rowIndex,
      ...blockLayout(range),
      aria: `Rango en edición: ${range.period}T de ${range.startMinute}′ a ${range.endMinute}′`
    };
  });

  isLinked(assignment: ZoneAssignmentResponse): boolean {
    const cell = this.highlightCell();
    return !!cell && assignment.row === cell.row && assignment.col === cell.col;
  }

  selectSegment(event: Event, assignment: ZoneAssignmentResponse): void {
    event.stopPropagation();
    this.segmentSelected.emit(assignment);
  }

  onTracksClick(event: MouseEvent): void {
    const target = this.targetAt(event);
    if (target) {
      this.gapSelected.emit({ period: target.gap.period, startMinute: target.gap.start, endMinute: target.gap.end, col: target.col });
    }
  }

  onTracksMove(event: MouseEvent): void {
    const target = this.targetAt(event);
    const current = this.pointed();
    if (target?.col === current?.col && target?.gap.start === current?.gap.start && target?.gap.period === current?.gap.period) return;
    this.pointed.set(target);
  }

  onTracksLeave(): void {
    this.pointed.set(null);
  }

  /** Franja (por la altura del puntero) y hueco (por el minuto) bajo el puntero; null si ese minuto ya tiene tramo. */
  private targetAt(event: MouseEvent): { col: number; gap: PeriodGap } | null {
    const rect = this.tracks()?.nativeElement.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    const rows = territoryRows();
    const rowIndex = Math.min(Math.max(Math.floor(((event.clientY - rect.top) / rect.height) * rows.length), 0), rows.length - 1);
    const gap = gapAtMinute(this.assignments(), minuteAtOffset(event.clientX - rect.left, rect.width));
    return gap ? { col: rows[rowIndex].col, gap } : null;
  }
}
