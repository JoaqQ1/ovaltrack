import { Component, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchReviewStore } from '../../store/match-review.store';
import { ReviewEventViewModel } from '../../types/match-review.types';

@Component({
  selector: 'app-post-match-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match-table.component.html',
  styleUrl: './post-match-table.component.css'
})
export class PostMatchTableComponent {
  readonly store = inject(MatchReviewStore);
  private readonly elementRef = inject(ElementRef);

  constructor() {
    effect(() => {
      const selectedId = this.store.selectedEventId();
      if (!selectedId) return;

      setTimeout(() => {
        const row = this.elementRef.nativeElement.querySelector(`[data-event-id="${selectedId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    });
  }

  onRowClick(ev: ReviewEventViewModel): void {
    this.store.selectEvent(ev.id);
  }
}
