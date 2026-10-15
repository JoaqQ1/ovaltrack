import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { MatchReviewStore } from '../../store/match-review.store';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Possession } from '../../../types/live-capture.types';
import { MatchTimelineEventResponse } from '../../../types/event.types';
import { ReviewEventViewModel } from '../../types/match-review.types';
import { ModalComponent } from '../../../../modal/modal.component';
import { EventFormComponent, EventFormData } from '../event-form/event-form.component';

@Component({
  selector: 'app-post-match-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, EventFormComponent],
  templateUrl: './post-match-panel.component.html',
  styleUrl: './post-match-panel.component.css'
})
export class PostMatchPanelComponent {
  readonly store = inject(MatchReviewStore);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  // Solapas de Inspección: Ver o Editar
  readonly activeTab = signal<'view' | 'edit'>('view');

  // Estado del Autoguardado
  readonly saveStatus = signal<'saved' | 'saving' | 'error' | 'idle'>('saved');
  private readonly saveSubject = new Subject<{ id: string; payload: Partial<MatchTimelineEventResponse> }>();

  // Estado del Bottom Sheet en Tablet/Mobile (< 1121px)
  readonly sheetState = signal<'peek' | 'open'>('peek');

  // Estados de Modales
  readonly showDeleteModal = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  constructor() {
    this.saveSubject.pipe(
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.saveStatus.set('saving')),
      switchMap(({ id, payload }) =>
        this.eventService.update(id, payload).pipe(
          tap(() => {
            this.store.updateEvent(id, payload);
            this.saveStatus.set('saved');
          }),
          catchError(() => {
            this.saveStatus.set('error');
            this.toastService.error('Error al autoguardar la jugada');
            return of(null);
          })
        )
      ),
      takeUntilDestroyed()
    ).subscribe();
  }

  onFormChange(formData: EventFormData): void {
    const ev = this.store.selectedEvent();
    if (!ev) return;
    this.saveStatus.set('saving');
    this.saveSubject.next({
      id: ev.id,
      payload: {
        eventTypeId: formData.eventTypeId,
        teamPossession: formData.teamPossession,
        playerId: formData.playerId
      }
    });
  }

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
    this.store.selectPrevPending();
  }

  onNextPendingClick(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.store.selectNextPending();
  }

  openEditMode(): void {
    this.sheetState.set('open');
    this.activeTab.set('edit');
  }

  openEditModal(): void {
    this.openEditMode();
  }

  onEditModalFromPeek(event: MouseEvent): void {
    event.stopPropagation();
    this.openEditMode();
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
