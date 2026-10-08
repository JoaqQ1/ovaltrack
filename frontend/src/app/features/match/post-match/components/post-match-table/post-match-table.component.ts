import { Component, inject } from '@angular/core';
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

  onRowClick(ev: ReviewEventViewModel): void {
    this.store.selectEvent(ev.id);
  }
}
