import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatchReviewStore } from '../../store/match-review.store';
import { ReviewEventViewModel } from '../../types/match-review.types';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-post-match-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule, FormsModule],
  templateUrl: './post-match-table.component.html',
  styleUrl: './post-match-table.component.css'
})
export class PostMatchTableComponent implements AfterViewInit, OnDestroy {
  @Output() editRequested = new EventEmitter<ReviewEventViewModel>();
  @Output() deleteRequested = new EventEmitter<ReviewEventViewModel>();
  readonly store = inject(MatchReviewStore);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);
  private readonly elementRef = inject(ElementRef);

  readonly isAssigning = signal<boolean>(false);

  isNoteModalOpen = false;
  activeEventForNote: ReviewEventViewModel | null = null;
  draftNote = '';

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const selectedId = this.store.selectedEventId();
      if (!selectedId) return;

      const events = this.store.visibleEvents();
      const index = events.findIndex(e => e.id === selectedId);
      if (index >= 0 && this.viewport) {
        const viewportHeight = this.viewport.getViewportSize() || 272;
        const itemsInView = Math.floor(viewportHeight / 34);
        const targetIndex = Math.max(0, index - Math.floor(itemsInView / 2));
        this.viewport.scrollToIndex(targetIndex, 'smooth');
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver !== 'undefined' && this.elementRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.viewport?.checkViewportSize();
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
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

  openNoteModal(ev: ReviewEventViewModel): void {
    console.log('Evento clickeado:', ev); // <-- AGREGÁ ESTO
    this.activeEventForNote = ev;
    this.draftNote = ev.note || ''; 
    this.isNoteModalOpen = true;
  }

  closeNoteModal(): void {
    this.isNoteModalOpen = false;
    this.activeEventForNote = null;
    this.draftNote = '';
  }

  saveNote(): void {
    if (!this.activeEventForNote) return;
    const eventId = this.activeEventForNote.id;
    
    this.eventService.update(eventId, { note: this.draftNote }).subscribe({
      next: () => {
        // ESTA LÍNEA actualiza la tabla en tiempo real:
        this.store.updateEvent(eventId, { note: this.draftNote }); 
        
        this.toastService.success('Nota guardada correctamente');
        this.closeNoteModal();
      },
      error: () => {
        this.toastService.error('Error al guardar la nota');
      }
    });
  }
}
