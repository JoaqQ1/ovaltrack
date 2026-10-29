import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchZonesStore } from '../../store/match-zones.store';
import { periodBounds, validateZoneForm } from '../../utils/zone-form.utils';
import { ZONE_GRID_COLS, ZONE_GRID_ROWS, ZoneAssignmentResponse, ZonePeriod } from '../../../types/zone.types';

@Component({
  selector: 'app-zone-assignment-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zone-assignment-editor.component.html',
  styleUrl: './zone-assignment-editor.component.css'
})
export class ZoneAssignmentEditorComponent implements OnChanges {
  readonly store = inject(MatchZonesStore);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() isOpen = false;
  @Input() matchId = '';
  @Output() close = new EventEmitter<void>();

  readonly rows = Array.from({ length: ZONE_GRID_ROWS }, (_, i) => i + 1);
  readonly cols = Array.from({ length: ZONE_GRID_COLS }, (_, i) => i + 1);
  readonly columnLabels = ['Ingoal', '22', 'Mitad', 'Mitad', '22', 'Ingoal'];

  // Estado del formulario
  period: ZonePeriod = 1;
  startMinute: number | null = 0;
  endMinute: number | null = 40;
  row: number | null = null;
  col: number | null = null;
  editingId: string | null = null;
  pendingDeleteId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.matchId) {
      this.resetForm();
      this.store.load(this.matchId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ error: err => this.toastService.error(this.messageFrom(err, 'No se pudieron cargar las zonas')) });
    }
  }

  onPeriodChange(): void {
    const bounds = periodBounds(this.period);
    this.startMinute = bounds.start;
    this.endMinute = bounds.end;
  }

  selectCell(row: number, col: number): void {
    this.row = row;
    this.col = col;
  }

  isSelected(row: number, col: number): boolean {
    return this.row === row && this.col === col;
  }

  startEdit(zone: ZoneAssignmentResponse): void {
    this.pendingDeleteId = null;
    this.editingId = zone.id;
    this.period = zone.period;
    this.startMinute = zone.startMinute;
    this.endMinute = zone.endMinute;
    this.row = zone.row;
    this.col = zone.col;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  save(): void {
    const error = validateZoneForm({
      period: this.period,
      startMinute: this.startMinute,
      endMinute: this.endMinute,
      row: this.row,
      col: this.col
    });
    if (error) {
      this.toastService.warning(error);
      return;
    }

    const request = {
      row: this.row as number,
      col: this.col as number,
      period: this.period,
      startMinute: this.startMinute as number,
      endMinute: this.endMinute as number
    };
    const wasEditing = this.editingId !== null;

    this.store.save(this.matchId, request, this.editingId ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(wasEditing ? 'Zona actualizada' : 'Zona asignada');
          this.resetForm();
        },
        // El formulario se conserva para que el usuario corrija sin volver a cargar los datos.
        error: err => this.toastService.error(this.messageFrom(err, 'No se pudo guardar la zona'))
      });
  }

  askDelete(zoneId: string): void {
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
          this.toastService.success('Zona eliminada');
        },
        error: err => {
          this.pendingDeleteId = null;
          this.toastService.error(this.messageFrom(err, 'No se pudo eliminar la zona'));
        }
      });
  }

  onClose(): void {
    if (this.store.isSaving()) return;
    this.close.emit();
  }

  periodLabel(period: number): string {
    return period === 1 ? '1T' : '2T';
  }

  private resetForm(): void {
    this.editingId = null;
    this.pendingDeleteId = null;
    this.period = 1;
    this.onPeriodChange();
    this.row = null;
    this.col = null;
  }

  private messageFrom(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: unknown } })?.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
