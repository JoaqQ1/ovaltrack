import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZoneCellRef, ZonePeriod } from '../../../types/zone.types';
import { zoneLabel } from '../../utils/zone-grid';
import { Territory, territoryOfColumn } from '../../utils/zone-territory';
import { EventMark, MarkEvent, buildEventMarks } from '../../utils/zone-event-marks';
import { findGaps } from '../../utils/zone-stats';

export interface ZoneGapSelection {
  period: ZonePeriod;
  startMinute: number;
  endMinute: number;
}

interface TimelineBar {
  left: number;
  width: number;
}

interface SegmentBar extends TimelineBar {
  assignment: ZoneAssignmentResponse;
  /** Aparece por primera vez (recién guardada): crece desde la izquierda. No aplica a la carga inicial. */
  isNew: boolean;
  territory: Territory;
  label: string;
  aria: string;
}

interface GapBar extends TimelineBar {
  selection: ZoneGapSelection;
  aria: string;
}

const TOTAL_MINUTES = ZONE_HALF_MINUTES * 2;
const TICKS = Array.from({ length: TOTAL_MINUTES / 10 + 1 }, (_, i) => i * 10);

const toPercent = (minutes: number): number => (minutes / TOTAL_MINUTES) * 100;

const MARK_GLYPHS: Record<EventMark['kind'], string> = { try: '▲', kick: '●', card: '■', other: '·' };

interface MarkView extends EventMark {
  left: number;
  glyph: string;
}

/** Línea de tiempo de 0' a 80': tramos como barras y huecos sin zona rayados. Presentacional. */
@Component({
  selector: 'app-zone-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zone-timeline.component.html',
  styleUrl: './zone-timeline.component.css'
})
export class ZoneTimelineComponent {
  readonly assignments = input<ZoneAssignmentResponse[]>([]);
  /** En modo lectura las barras y los huecos no responden. */
  readonly readOnly = input<boolean>(false);
  /** Tramo que choca con el rango en edición: se resalta en rojo. */
  readonly conflictId = input<string | null>(null);

  /** Eventos del partido: se dibujan como marcas sobre las barras para ver dónde cortar los tramos. */
  readonly events = input<MarkEvent[]>([]);

  /** Celda resaltada (hover o foco en la cancha, o celda elegida en "Ver eventos"): sus tramos se destacan y el resto se atenúa. */
  readonly highlightCell = input<ZoneCellRef | null>(null);

  /** Rango cargado en el formulario: se dibuja sobre la pista para ver dónde cae (ej. el próximo hueco). */
  readonly previewRange = input<{ period: ZonePeriod; startMinute: number; endMinute: number } | null>(null);

  readonly segmentSelected = output<ZoneAssignmentResponse>();
  /** Tramo bajo el cursor o el foco (null al salir): la cancha resalta su celda. */
  readonly segmentHover = output<string | null>();
  /** Tocar una marca propone su minuto como inicio o fin del rango. */
  readonly markSelected = output<{ period: ZonePeriod; minute: number }>();
  readonly gapSelected = output<ZoneGapSelection>();

  readonly ticks = TICKS.map(minute => ({ minute, left: toPercent(minute) }));
  readonly halfMark = toPercent(ZONE_HALF_MINUTES);

  /** Ids ya dibujados; null hasta la primera carga, así lo que ya existía no se anima. */
  private seenIds: Set<string> | null = null;

  readonly segments = computed<SegmentBar[]>(() => {
    const assignments = this.assignments();
    const seen = this.seenIds;
    this.seenIds = new Set(assignments.map(a => a.id));
    return assignments.map(assignment => ({
      assignment,
      isNew: seen !== null && !seen.has(assignment.id),
      territory: territoryOfColumn(assignment.col),
      left: toPercent(assignment.startMinute),
      width: toPercent(assignment.endMinute - assignment.startMinute),
      label: zoneLabel(assignment),
      aria: `Tramo ${assignment.period}T ${assignment.startMinute}′ a ${assignment.endMinute}′, zona ${zoneLabel(assignment)}`
    }));
  });

  readonly gaps = computed<GapBar[]>(() =>
    ([1, 2] as ZonePeriod[]).flatMap(period =>
      findGaps(this.assignments(), period).map(gap => ({
        selection: { period, startMinute: gap.start, endMinute: gap.end },
        left: toPercent(gap.start),
        width: toPercent(gap.end - gap.start),
        aria: `Sin zona de ${gap.start}′ a ${gap.end}′ (${period}T). Tocá para completar`
      }))));

  readonly marks = computed<MarkView[]>(() =>
    buildEventMarks(this.events()).map(mark => ({ ...mark, left: toPercent(mark.minute), glyph: MARK_GLYPHS[mark.kind] })));

  readonly preview = computed(() => {
    const range = this.previewRange();
    return range
      ? { left: toPercent(range.startMinute), width: toPercent(range.endMinute - range.startMinute),
          aria: `Rango en edición: ${range.period}T de ${range.startMinute}′ a ${range.endMinute}′` }
      : null;
  });

  readonly hasGaps = computed(() => this.gaps().length > 0);

  selectSegment(assignment: ZoneAssignmentResponse): void {
    if (!this.readOnly()) this.segmentSelected.emit(assignment);
  }

  isLinked(assignment: ZoneAssignmentResponse): boolean {
    const cell = this.highlightCell();
    return !!cell && assignment.row === cell.row && assignment.col === cell.col;
  }

  selectMark(mark: EventMark): void {
    if (!this.readOnly()) this.markSelected.emit({ period: mark.period, minute: mark.minute });
  }

  selectGap(selection: ZoneGapSelection): void {
    if (!this.readOnly()) this.gapSelected.emit(selection);
  }
}
