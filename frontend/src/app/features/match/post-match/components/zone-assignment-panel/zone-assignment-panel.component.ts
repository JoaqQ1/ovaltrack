import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject, model } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchZonesStore } from '../../store/match-zones.store';
import { validateZoneForm } from '../../utils/zone-form.utils';
import { ZONE_COLUMN_NAMES, ZONE_ROW_NAMES, describeZone, zoneLabel } from '../../utils/zone-grid';
import { describeSegment, eventsInRange, eventsReleasedByEdit, findOverlap, nextGap, periodRange, suggestRange } from '../../utils/zone-stats';
import { ZoneAssignmentRequest, ZoneAssignmentResponse, ZoneCellRef, ZonePeriod } from '../../../types/zone.types';

type RangeField = 'start' | 'end';

/** Cuánto tiempo queda disponible el "Deshacer" tras borrar un tramo. */
const UNDO_WINDOW_MS = 6000;

/**
 * Formulario de tramos (rango de tiempo + zona) y su lista. La zona se elige tocando la cancha.
 * Vocabulario: "tramo" = rango de tiempo con una zona; "zona" = celda de la cancha.
 */
@Component({
  selector: 'app-zone-assignment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zone-assignment-panel.component.html',
  styleUrl: './zone-assignment-panel.component.css'
})
export class ZoneAssignmentPanelComponent implements OnInit {
  readonly store = inject(MatchZonesStore);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() matchId = '';
  /** En el modo "Ver eventos" el panel solo muestra los tramos: sin formulario ni acciones. */
  @Input() readOnly = false;

  /** Zona elegida en la cancha (enlace bidireccional con la página). */
  readonly selectedCell = model<ZoneCellRef | null>(null);

  readonly periods: { value: ZonePeriod; label: string; range: string }[] = [
    { value: 1, label: '1T', range: `${periodRange(1).start}–${periodRange(1).end}′` },
    { value: 2, label: '2T', range: `${periodRange(2).start}–${periodRange(2).end}′` }
  ];

  // Estado del formulario: sin rango por defecto, nada se guarda sin que el usuario lo decida.
  period: ZonePeriod = 1;
  startMinute: number | null = null;
  endMinute: number | null = null;
  editingId: string | null = null;
  helpOpen = false;
  serverError: string | null = null;
  listError: string | null = null;

  ngOnInit(): void {
    this.applySuggestion();
    this.destroyRef.onDestroy(() => {
      this.store.conflictId.set(null);
      this.store.formRange.set(null);
      this.store.hoverSegmentId.set(null);
    });
  }

  /** Precarga el formulario con un rango (ej. al tocar un hueco de la línea de tiempo). */
  prefill(range: { period: ZonePeriod; startMinute: number; endMinute: number }): void {
    this.editingId = null;
    this.serverError = null;
    this.period = range.period;
    this.startMinute = range.startMinute;
    this.endMinute = range.endMinute;
    this.syncSharedState();
  }

  /**
   * Completa el rango desde una marca de evento: si cambia de tiempo o el minuto no supera a "Desde", lo fija como
   * "Desde"; en otro caso lo toma como "Hasta". Así "Desde" ya precargado no impide elegir un nuevo inicio.
   */
  pickMinute(period: ZonePeriod, minute: number): void {
    if (this.readOnly) return;

    if (period !== this.period) {
      this.period = period;
      this.startMinute = minute;
      this.endMinute = null;
    } else if (this.startMinute === null || minute <= this.startMinute) {
      this.startMinute = minute;
      if (this.endMinute !== null && this.endMinute <= minute) this.endMinute = null;
    } else {
      this.endMinute = minute;
    }
    this.serverError = null;
    this.syncSharedState();
  }

  setPeriod(period: ZonePeriod): void {
    this.period = period;
    this.serverError = null;
    this.applySuggestion();
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  onRangeChange(): void {
    this.serverError = null;
    this.syncSharedState();
  }

  /** Botones − y + junto a cada minuto. */
  adjust(field: RangeField, delta: number): void {
    const bounds = periodRange(this.period);
    const current = field === 'start' ? this.startMinute : this.endMinute;
    const base = current ?? (field === 'start' ? bounds.start : (this.startMinute ?? bounds.start));
    const next = Math.min(Math.max(base + delta, bounds.start), bounds.end);

    if (field === 'start') this.startMinute = next;
    else this.endMinute = next;
    this.serverError = null;
    this.syncSharedState();
  }

  /** Motivo por el que no se puede guardar todavía (null = listo). Se muestra junto al botón. */
  get blockReason(): string | null {
    const cell = this.selectedCell();
    if (!cell) return 'Falta elegir la zona: tocala en la cancha.';

    const formError = validateZoneForm({
      period: this.period,
      startMinute: this.startMinute,
      endMinute: this.endMinute,
      row: cell.row,
      col: cell.col
    });
    if (formError) return formError;

    const clash = findOverlap(this.currentRange(), this.store.assignments(), this.editingId);
    return clash ? `Choca con el tramo ${describeSegment(clash)}.` : null;
  }

  /** Con el partido completo no queda ningún hueco para ir a buscar. */
  get matchComplete(): boolean {
    return nextGap(this.store.assignments(), null) === null;
  }

  /** Precarga el formulario con el próximo hueco sin zona (todo su rango); la timeline lo muestra como vista previa. */
  goToNextGap(): void {
    const gap = nextGap(this.store.assignments(), this.startMinute);
    if (gap) this.prefill({ period: gap.period, startMinute: gap.start, endMinute: gap.end });
  }

  /** Eventos que quedarían vinculados con el rango actual; null mientras el rango no sea válido. */
  get linkedEventCount(): number | null {
    return this.rangeIsUsable() ? eventsInRange(this.currentRange(), this.store.events()).length : null;
  }

  /** Al editar: eventos que hoy tienen zona gracias a este tramo y la perderían con el nuevo rango. */
  get releasedEventCount(): number {
    const original = this.editingId ? this.store.assignments().find(a => a.id === this.editingId) : undefined;
    if (!original || !this.rangeIsUsable()) return 0;
    return eventsReleasedByEdit(original, this.currentRange(), this.store.events()).length;
  }

  /** Eventos de un tramo: son los que pasan a "Sin zona" si se elimina. */
  eventsOf(zone: ZoneAssignmentResponse): number {
    return eventsInRange(zone, this.store.events()).length;
  }

  startEdit(zone: ZoneAssignmentResponse): void {
    this.serverError = null;
    this.editingId = zone.id;
    this.period = zone.period;
    this.startMinute = zone.startMinute;
    this.endMinute = zone.endMinute;
    this.selectedCell.set({ row: zone.row, col: zone.col });
    this.syncSharedState();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  save(): void {
    const cell = this.selectedCell();
    if (!cell || this.blockReason) return;

    const request = { row: cell.row, col: cell.col, ...this.currentRange() };
    const wasEditing = this.editingId !== null;

    this.store.save(this.matchId, request, this.editingId ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(wasEditing ? 'Tramo actualizado' : 'Tramo guardado');
          this.resetForm(request.endMinute);
        },
        // El formulario se conserva: el error queda inline junto al botón y además se avisa con un toast.
        error: err => {
          this.serverError = this.messageFrom(err, 'No se pudo guardar el tramo');
          this.toastService.error(this.serverError);
          this.syncSharedState();
        }
      });
  }

  /** Quita el tramo de inmediato; "Deshacer" lo vuelve a crear con un POST con los mismos datos. */
  deleteZone(zone: ZoneAssignmentResponse): void {
    this.listError = null;
    const released = this.eventsOf(zone);
    const restore: ZoneAssignmentRequest = {
      row: zone.row, col: zone.col, period: zone.period, startMinute: zone.startMinute, endMinute: zone.endMinute
    };

    this.store.remove(this.matchId, zone.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.editingId === zone.id) this.resetForm();
          else this.syncSharedState();
          this.toastService.success(
            released > 0
              ? `${released} ${released === 1 ? 'evento pasa' : 'eventos pasan'} a "Sin zona".`
              : 'Se quitó de la lista de tramos.',
            'Tramo eliminado',
            UNDO_WINDOW_MS,
            { label: 'Deshacer', handler: () => this.undoDelete(restore) }
          );
        },
        error: err => this.listError = this.messageFrom(err, 'No se pudo eliminar el tramo')
      });
  }

  /** Corre desde el toast, que puede sobrevivir al panel: no se cancela si el usuario navega. */
  private undoDelete(restore: ZoneAssignmentRequest): void {
    this.store.save(this.matchId, restore).subscribe({
      next: () => this.toastService.success('El tramo volvió a la lista.', 'Tramo restaurado'),
      error: err => this.toastService.error(
        this.messageFrom(err, 'No se pudo restaurar el tramo.'),
        'No se pudo deshacer'
      )
    });
  }

  rowName(row: number): string {
    return ZONE_ROW_NAMES[row - 1];
  }

  columnName(col: number): string {
    return ZONE_COLUMN_NAMES[col - 1];
  }

  label(cell: ZoneCellRef): string {
    return zoneLabel(cell);
  }

  describe(cell: ZoneCellRef): string {
    return describeZone(cell);
  }

  segmentName(zone: ZoneAssignmentResponse): string {
    return `${zone.period}T ${zone.startMinute}′–${zone.endMinute}′, ${zoneLabel(zone)}`;
  }

  private rangeIsUsable(): boolean {
    const { startMinute, endMinute } = this;
    if (startMinute === null || endMinute === null || !Number.isInteger(startMinute) || !Number.isInteger(endMinute)) return false;
    const bounds = periodRange(this.period);
    return startMinute < endMinute && startMinute >= bounds.start && endMinute <= bounds.end;
  }

  private currentRange(): { period: ZonePeriod; startMinute: number; endMinute: number } {
    return { period: this.period, startMinute: this.startMinute as number, endMinute: this.endMinute as number };
  }

  /** Propone los próximos 5 minutos libres del tiempo (o continúa desde `afterMinute`); null si está cubierto. */
  private applySuggestion(afterMinute?: number): void {
    const range = suggestRange(this.store.assignments(), this.period, afterMinute);
    this.startMinute = range?.start ?? null;
    this.endMinute = range?.end ?? null;
    this.syncSharedState();
  }

  /**
   * Publica en el store lo que otras vistas necesitan del formulario: el tramo que se pisa con el rango actual
   * (null si no hay choque) y el rango cargado, que la timeline dibuja como vista previa.
   */
  private syncSharedState(): void {
    const usable = !this.readOnly && this.rangeIsUsable();
    const range = usable ? this.currentRange() : null;
    const clash = range ? findOverlap(range, this.store.assignments(), this.editingId) : null;
    this.store.conflictId.set(clash?.id ?? null);
    this.store.formRange.set(range);
  }

  /** Tras guardar o cancelar: la zona queda sin elegir a propósito y el rango continúa donde terminó el anterior. */
  private resetForm(afterMinute?: number): void {
    this.editingId = null;
    this.serverError = null;
    this.selectedCell.set(null);
    this.applySuggestion(afterMinute);
  }

  private messageFrom(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: unknown } })?.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
