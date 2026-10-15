import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Possession } from '../../../types/live-capture.types';
import { ReviewEventViewModel } from '../../types/match-review.types';
import { ModalComponent } from '../../../../modal/modal.component';

@Component({
  selector: 'app-post-match-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './post-match-panel.component.html',
  styleUrl: './post-match-panel.component.css'
})
export class PostMatchPanelComponent {
  readonly store = inject(MatchReviewStore);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  // Estado del Bottom Sheet en Tablet/Mobile (< 1121px)
  readonly sheetState = signal<'peek' | 'open'>('peek');

  // Estados de Modales
  readonly showEditModal = signal<boolean>(false);
  readonly showDeleteModal = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Formulario del Modal de Edición
  editEventTypeId = '';
  editTeamPossession: Possession = 'OWN';
  editPlayerId = '';

  readonly currentPendingIndex = computed(() => {
    const selectedId = this.store.selectedEventId();
    const queue = this.store.pendingQueue();
    const index = queue.findIndex(e => e.id === selectedId);
    return index >= 0 ? index + 1 : (queue.length > 0 ? 1 : 0);
  });

  toggleSheet(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.sheetState.update(s => s === 'peek' ? 'open' : 'peek');
  }

  openSheet(): void {
    this.sheetState.set('open');
  }

  closeSheet(): void {
    this.sheetState.set('peek');
  }

  onPrevPendingClick(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const queue = this.store.pendingQueue();
    if (queue.length === 0) return;
    const currentId = this.store.selectedEventId();
    const currentIndex = queue.findIndex(e => e.id === currentId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    this.store.selectEvent(queue[prevIndex].id);
  }

  onNextPendingClick(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.store.selectNextPending();
  }

  onEditModalFromPeek(event: MouseEvent): void {
    event.stopPropagation();
    this.openEditModal();
  }

  // --- Asignación Rápida desde el Panel ---
  onQuickPlayerModelChange(newPlayerId: string, ev: ReviewEventViewModel): void {
    const finalPlayerId = newPlayerId.trim() || null;
    this.isSubmitting.set(true);
    this.eventService.update(ev.id, {
      playerId: finalPlayerId,
      teamPossession: ev.teamPossession
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.store.updateEvent(ev.id, { playerId: finalPlayerId });
        this.toastService.success('Jugador asignado correctamente');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Error al actualizar el jugador');
      }
    });
  }

  // --- Apertura y Manejo de Modal de Edición Avanzada ---
  openEditModal(): void {
    const ev = this.store.selectedEvent();
    if (!ev) return;

    this.editEventTypeId = ev.eventTypeId;
    this.editTeamPossession = ev.teamPossession || 'OWN';
    this.editPlayerId = ev.playerId || '';
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  onPossessionChange(): void {
    if (this.editTeamPossession === 'OPPONENT') {
      this.editPlayerId = ''; // Limpiar jugador automáticamente para el rival
    }
  }

  saveEditModal(): void {
    const ev = this.store.selectedEvent();
    if (!ev) return;

    if (!this.editEventTypeId) {
      this.toastService.warning('Debés seleccionar un tipo de evento');
      return;
    }

    const playerId = (this.editTeamPossession === 'OPPONENT') ? null : (this.editPlayerId.trim() || null);

    this.isSubmitting.set(true);
    this.eventService.update(ev.id, {
      eventTypeId: this.editEventTypeId,
      teamPossession: this.editTeamPossession,
      playerId: playerId
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.store.updateEvent(ev.id, {
          eventTypeId: this.editEventTypeId,
          teamPossession: this.editTeamPossession,
          playerId: playerId
        });

        this.closeEditModal();
        this.toastService.success('Evento actualizado exitosamente');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('No se pudo guardar la modificación del evento');
      }
    });
  }

  // --- Apertura y Manejo de Modal de Eliminación ---
  openDeleteModal(): void {
    if (!this.store.selectedEvent()) return;
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const ev = this.store.selectedEvent();
    if (!ev) return;

    this.isSubmitting.set(true);
    this.eventService.delete(ev.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.store.removeEvent(ev.id);
        this.closeDeleteModal();
        this.toastService.success('Evento eliminado correctamente');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Error al eliminar el evento');
      }
    });
  }
}
