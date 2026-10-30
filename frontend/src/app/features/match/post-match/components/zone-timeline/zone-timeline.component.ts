import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZoneCellRef, ZonePeriod } from '../../../types/zone.types';
import { zoneLabel } from '../../utils/zone-grid';
import { Territory, territoryOfColumn } from '../../utils/zone-territory';
import { EventMark, MarkEvent, buildEventMarks } from '../../utils/zone-event-marks';
import { findGaps } from '../../utils/zone-stats';
import { DragRange, DragResult, dragNewRange, minuteAtPosition, resizeRange } from '../../utils/zone-drag';

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

/** Cuánto dura el aviso de por qué se frenó un arrastre, ya soltado el puntero. */
const NOTICE_MS = 3500;

type ActiveDrag =
  | { kind: 'new'; period: ZonePeriod; anchor: number }
  | { kind: 'resize'; assignment: ZoneAssignmentResponse; edge: 'start' | 'end' };

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
  /** Arrastrar sobre un hueco propone ese rango; el usuario lo completa con la zona y guarda. */
  readonly gapSelected = output<ZoneGapSelection>();
  /** Estirar o achicar un borde propone el nuevo rango del tramo; no se guarda solo. */
  readonly segmentResized = output<{ assignment: ZoneAssignmentResponse; startMinute: number; endMinute: number }>();

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private active: ActiveDrag | null = null;
  private suppressClick = false;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Rango provisorio mientras se arrastra (null fuera de un arrastre o antes de moverse). */
  readonly draft = signal<DragRange | null>(null);
  /** Motivo por el que el arrastre se frenó (entretiempo, final del partido u otro tramo). */
  readonly dragNotice = signal<string | null>(null);

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

  readonly draftBar = computed(() => {
    const range = this.draft();
    return range ? { left: toPercent(range.startMinute), width: toPercent(range.endMinute - range.startMinute) } : null;
  });

  readonly hasGaps = computed(() => this.gaps().length > 0);

  selectSegment(assignment: ZoneAssignmentResponse): void {
    if (!this.readOnly() && !this.suppressClick) this.segmentSelected.emit(assignment);
  }

  isLinked(assignment: ZoneAssignmentResponse): boolean {
    const cell = this.highlightCell();
    return !!cell && assignment.row === cell.row && assignment.col === cell.col;
  }

  selectMark(mark: EventMark): void {
    if (!this.readOnly()) this.markSelected.emit({ period: mark.period, minute: mark.minute });
  }

  selectGap(selection: ZoneGapSelection): void {
    if (!this.readOnly() && !this.suppressClick) this.gapSelected.emit(selection);
  }

  // --- Arrastre con Pointer Events (mouse y touch). El formulario sigue siendo la alternativa con teclado. ---

  /** Pointer down sobre un hueco: empieza a dibujar un rango desde ese minuto. */
  startGapDrag(event: PointerEvent, selection: ZoneGapSelection): void {
    if (!this.canDrag(event)) return;
    const minute = this.minuteAt(event);
    const anchor = Math.min(Math.max(minute, selection.startMinute), selection.endMinute);
    this.begin(event, { kind: 'new', period: selection.period, anchor });
  }

  /** Pointer down sobre una manija de borde: empieza a estirar o achicar ese tramo. */
  startHandleDrag(event: PointerEvent, assignment: ZoneAssignmentResponse, edge: 'start' | 'end'): void {
    if (!this.canDrag(event)) return;
    event.stopPropagation();
    this.begin(event, { kind: 'resize', assignment, edge });
  }

  moveDrag(event: PointerEvent): void {
    if (!this.active) return;
    const result = this.resolve(this.active, this.minuteAt(event));
    this.draft.set(result.range);
    this.showNotice(result.notice);
  }

  endDrag(): void {
    const drag = this.active;
    if (!drag) return;
    this.active = null;

    const range = this.draft();
    this.draft.set(null);
    if (!range) return; // sin arrastre real es un clic: sigue su curso normal (abrir el tramo o precargar el hueco)

    // El click que el navegador dispara tras soltar no debe abrir el tramo ni pisar el rango propuesto.
    this.suppressClick = true;
    setTimeout(() => this.suppressClick = false, 0);

    if (drag.kind === 'new') {
      this.gapSelected.emit({ period: range.period, startMinute: range.startMinute, endMinute: range.endMinute });
    } else if (range.startMinute !== drag.assignment.startMinute || range.endMinute !== drag.assignment.endMinute) {
      this.segmentResized.emit({ assignment: drag.assignment, startMinute: range.startMinute, endMinute: range.endMinute });
    }
  }

  cancelDrag(): void {
    this.active = null;
    this.draft.set(null);
    this.showNotice(null);
  }

  private canDrag(event: PointerEvent): boolean {
    return !this.readOnly() && (event.pointerType !== 'mouse' || event.button === 0);
  }

  private begin(event: PointerEvent, drag: ActiveDrag): void {
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Sin puntero activo (ej. eventos sintéticos): el arrastre sigue con los eventos de la propia pista.
    }
    this.active = drag;
    this.draft.set(null);
    this.showNotice(null);
  }

  private resolve(drag: ActiveDrag, minute: number): DragResult {
    return drag.kind === 'new'
      ? dragNewRange(this.assignments(), drag.period, drag.anchor, minute)
      : resizeRange(this.assignments(), drag.assignment, drag.edge, minute);
  }

  private minuteAt(event: PointerEvent): number {
    const rect = this.track()?.nativeElement.getBoundingClientRect();
    return rect ? minuteAtPosition(event.clientX - rect.left, rect.width) : 0;
  }

  private showNotice(message: string | null): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.dragNotice.set(message);
    this.noticeTimer = message ? setTimeout(() => this.dragNotice.set(null), NOTICE_MS) : null;
  }
}
