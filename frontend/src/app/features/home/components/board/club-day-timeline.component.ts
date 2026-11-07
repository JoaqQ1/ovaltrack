import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { layoutClubDay } from '../../domain/club-day-lanes';
import { ClubDayTimelineItem } from '../../types/home.types';

const LANE_HEIGHT_PX = 84;

interface PositionedItem {
  item: ClubDayTimelineItem;
  left: number;
  width: number;
  top: number;
}

/** Línea de tiempo del día del club: carriles para los partidos que se solapan; lista vertical en celular. */
@Component({
  selector: 'app-club-day-timeline',
  standalone: true,
  templateUrl: './club-day-timeline.component.html',
  styleUrl: './club-day-timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClubDayTimelineComponent {
  readonly items = input.required<ClubDayTimelineItem[]>();
  /** Minuto actual del día si el timeline es el de hoy; `null` en "mañana". */
  readonly nowMinute = input<number | null>(null);

  readonly layout = computed(() => layoutClubDay(this.items()));

  readonly laneHeight = LANE_HEIGHT_PX;

  readonly trackHeight = computed(() => (this.layout()?.laneCount ?? 1) * LANE_HEIGHT_PX);

  readonly hours = computed(() => {
    const range = this.layout()?.range;
    if (!range) return [];
    const span = range.endMinute - range.startMinute;
    const hours: { label: string; left: number }[] = [];
    for (let minute = range.startMinute; minute <= range.endMinute; minute += 60) {
      hours.push({ label: `${String(minute / 60).padStart(2, '0')}:00`, left: ((minute - range.startMinute) / span) * 100 });
    }
    return hours;
  });

  readonly positioned = computed<PositionedItem[]>(() => {
    const layout = this.layout();
    if (!layout) return [];
    const { startMinute, endMinute } = layout.range;
    const span = endMinute - startMinute;
    const byId = new Map(this.items().map(item => [item.id, item]));
    return layout.items.flatMap(lane => {
      const item = byId.get(lane.id);
      return item
        ? [{ item, left: ((lane.startMinute - startMinute) / span) * 100, width: ((lane.endMinute - lane.startMinute) / span) * 100, top: lane.lane * LANE_HEIGHT_PX }]
        : [];
    });
  });

  readonly nowLeft = computed(() => {
    const layout = this.layout();
    const now = this.nowMinute();
    if (!layout || now === null) return null;
    const { startMinute, endMinute } = layout.range;
    return now >= startMinute && now <= endMinute ? ((now - startMinute) / (endMinute - startMinute)) * 100 : null;
  });
}
