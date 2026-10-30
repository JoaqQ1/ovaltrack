import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZonePeriod } from '../../../types/zone.types';
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

  readonly segmentSelected = output<ZoneAssignmentResponse>();
  /** Tocar una marca propone su minuto como inicio o fin del rango. */
  readonly markSelected = output<{ period: ZonePeriod; minute: number }>();
  readonly gapSelected = output<ZoneGapSelection>();

  readonly ticks = TICKS.map(minute => ({ minute, left: toPercent(minute) }));
  readonly halfMark = toPercent(ZONE_HALF_MINUTES);

  readonly segments = computed<SegmentBar[]>(() =>
    this.assignments().map(assignment => ({
      assignment,
      territory: territoryOfColumn(assignment.col),
      left: toPercent(assignment.startMinute),
      width: toPercent(assignment.endMinute - assignment.startMinute),
      label: zoneLabel(assignment),
      aria: `Tramo ${assignment.period}T ${assignment.startMinute}′ a ${assignment.endMinute}′, zona ${zoneLabel(assignment)}`
    })));

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

  readonly hasGaps = computed(() => this.gaps().length > 0);

  selectSegment(assignment: ZoneAssignmentResponse): void {
    if (!this.readOnly()) this.segmentSelected.emit(assignment);
  }

  selectMark(mark: EventMark): void {
    if (!this.readOnly()) this.markSelected.emit({ period: mark.period, minute: mark.minute });
  }

  selectGap(selection: ZoneGapSelection): void {
    if (!this.readOnly()) this.gapSelected.emit(selection);
  }
}
