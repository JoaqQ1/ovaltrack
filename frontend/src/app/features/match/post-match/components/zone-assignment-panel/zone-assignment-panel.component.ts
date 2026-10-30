import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject, model } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchZonesStore } from '../../store/match-zones.store';
import { validateZoneForm } from '../../utils/zone-form.utils';
import { ZONE_COLUMN_NAMES, ZONE_ROW_NAMES, describeZone, zoneLabel } from '../../utils/zone-grid';
import { describeSegment, eventsInRange, eventsReleasedByEdit, findOverlap, periodRange, suggestRange } from '../../utils/zone-stats';
import { ZoneAssignmentResponse, ZoneCellRef, ZonePeriod } from '../../../types/zone.types';

type RangeField = 'start' | 'end';

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
  pendingDeleteId: string | null = null;
  helpOpen = false;
  serverError: string | null = null;
  listError: string | null = null;

  ngOnInit(): void {
    this.applySuggestion();
  }

  /** Precarga el formulario con un rango (ej. al tocar un hueco de la línea de tiempo). */
  prefill(range: { period: ZonePeriod; startMinute: number; endMinute: number }): void {
    this.editingId = null;
    this.pendingDeleteId = null;
    this.serverError = null;
    this.period = range.period;
    this.startMinute = range.startMinute;
    this.endMinute = range.endMinute;
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
    this.pendingDeleteId = null;
    this.serverError = null;
    this.editingId = zone.id;
    this.period = zone.period;
    this.startMinute = zone.startMinute;
    this.endMinute = zone.endMinute;
    this.selectedCell.set({ row: zone.row, col: zone.col });
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
        // El formulario se conserva y el error queda visible junto al botón.
        error: err => this.serverError = this.messageFrom(err, 'No se pudo guardar el tramo')
      });
  }

  askDelete(zoneId: string): void {
    this.listError = null;
    this.pendingDeleteId = zoneId;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmDelete(): void {
    const zoneId = this.pendingDeleteId;
    if (!zoneId) return;

    this.store.remove(this.matchId, zoneId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingDeleteId = null;
          if (this.editingId === zoneId) this.resetForm();
          this.toastService.success('Tramo eliminado');
        },
        error: err => {
          this.pendingDeleteId = null;
          this.listError = this.messageFrom(err, 'No se pudo eliminar el tramo');
        }
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
  }

  /** Tras guardar o cancelar: la zona queda sin elegir a propósito y el rango continúa donde terminó el anterior. */
  private resetForm(afterMinute?: number): void {
    this.editingId = null;
    this.pendingDeleteId = null;
    this.serverError = null;
    this.selectedCell.set(null);
    this.applySuggestion(afterMinute);
  }

  private messageFrom(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: unknown } })?.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
