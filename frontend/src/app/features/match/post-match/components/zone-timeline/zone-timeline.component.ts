import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZonePeriod } from '../../../types/zone.types';
import { zoneLabel } from '../../utils/zone-grid';
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

  readonly segmentSelected = output<ZoneAssignmentResponse>();
  readonly gapSelected = output<ZoneGapSelection>();

  readonly ticks = TICKS.map(minute => ({ minute, left: toPercent(minute) }));
  readonly halfMark = toPercent(ZONE_HALF_MINUTES);

  readonly segments = computed<SegmentBar[]>(() =>
    this.assignments().map(assignment => ({
      assignment,
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

  readonly hasGaps = computed(() => this.gaps().length > 0);

  selectSegment(assignment: ZoneAssignmentResponse): void {
    if (!this.readOnly()) this.segmentSelected.emit(assignment);
  }

  selectGap(selection: ZoneGapSelection): void {
    if (!this.readOnly()) this.gapSelected.emit(selection);
  }
}
