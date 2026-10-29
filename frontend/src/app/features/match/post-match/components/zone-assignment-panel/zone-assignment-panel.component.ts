import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject, model } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchZonesStore } from '../../store/match-zones.store';
import { periodBounds, validateZoneForm } from '../../utils/zone-form.utils';
import { ZONE_GRID_COLS, ZoneAssignmentResponse, ZoneCellRef, ZonePeriod } from '../../../types/zone.types';

/** Lista de zonas del partido y formulario para crearlas/editarlas. La celda se elige en la cancha. */
@Component({
  selector: 'app-zone-assignment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zone-assignment-panel.component.html',
  styleUrl: './zone-assignment-panel.component.css'
})
export class ZoneAssignmentPanelComponent {
  readonly store = inject(MatchZonesStore);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() matchId = '';

  /** Celda elegida en la cancha (enlace bidireccional con la página). */
  readonly selectedCell = model<ZoneCellRef | null>(null);

  readonly columnLabels = ['Ingoal', '22', 'Mitad', 'Mitad', '22', 'Ingoal'];

  // Estado del formulario
  period: ZonePeriod = 1;
  startMinute: number | null = 0;
  endMinute: number | null = 40;
  editingId: string | null = null;
  pendingDeleteId: string | null = null;

  onPeriodChange(): void {
    const bounds = periodBounds(this.period);
    this.startMinute = bounds.start;
    this.endMinute = bounds.end;
  }

  startEdit(zone: ZoneAssignmentResponse): void {
    this.pendingDeleteId = null;
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
    const error = validateZoneForm({
      period: this.period,
      startMinute: this.startMinute,
      endMinute: this.endMinute,
      row: cell?.row ?? null,
      col: cell?.col ?? null
    });
    if (error) {
      this.toastService.warning(error);
      return;
    }

    const request = {
      row: cell!.row,
      col: cell!.col,
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

  periodLabel(period: number): string {
    return period === 1 ? '1T' : '2T';
  }

  cellLabel(cell: ZoneCellRef): string {
    const column = this.columnLabels[Math.min(Math.max(cell.col, 1), ZONE_GRID_COLS) - 1];
    return `Fila ${cell.row} · ${column} (col. ${cell.col})`;
  }

  private resetForm(): void {
    this.editingId = null;
    this.pendingDeleteId = null;
    this.period = 1;
    this.onPeriodChange();
    this.selectedCell.set(null);
  }

  private messageFrom(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: unknown } })?.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
