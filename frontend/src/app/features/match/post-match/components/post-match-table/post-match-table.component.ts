import { Component, ViewChild, effect, inject, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatchReviewStore } from '../../store/match-review.store';
import { ReviewEventViewModel } from '../../types/match-review.types';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-post-match-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './post-match-table.component.html',
  styleUrl: './post-match-table.component.css'
})
export class PostMatchTableComponent {
  @Output() editRequested = new EventEmitter<ReviewEventViewModel>();
  @Output() deleteRequested = new EventEmitter<ReviewEventViewModel>();
  readonly store = inject(MatchReviewStore);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  readonly isAssigning = signal<boolean>(false);

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;

  constructor() {
    effect(() => {
      const selectedId = this.store.selectedEventId();
      if (!selectedId) return;

      const events = this.store.visibleEvents();
      const index = events.findIndex(e => e.id === selectedId);
      if (index >= 0 && this.viewport) {
        this.viewport.scrollToIndex(index, 'smooth');
      }
    });
  }

  onRowClick(ev: ReviewEventViewModel): void {
    this.store.selectEvent(ev.id);
  }

  trackById(_index: number, item: ReviewEventViewModel): string {
    return item.id;
  }

  onEditClick(ev: ReviewEventViewModel, event: MouseEvent): void {
    event.stopPropagation();
    this.store.selectEvent(ev.id);
    this.editRequested.emit(ev);
  }

  onDeleteClick(ev: ReviewEventViewModel, event: MouseEvent): void {
    event.stopPropagation();
    this.store.selectEvent(ev.id);
    this.deleteRequested.emit(ev);
  }

  onQuickAssignPlayer(ev: ReviewEventViewModel, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const playerId = select.value.trim() || null;
    if (!playerId) return;

    this.isAssigning.set(true);
    this.eventService.update(ev.id, {
      playerId: playerId,
      teamPossession: ev.teamPossession
    }).subscribe({
      next: () => {
        this.isAssigning.set(false);
        this.store.updateEvent(ev.id, { playerId: playerId });
        this.toastService.success('Jugador asignado correctamente');
      },
      error: () => {
        this.isAssigning.set(false);
        this.toastService.error('Error al asignar jugador');
      }
    });
  }
}
