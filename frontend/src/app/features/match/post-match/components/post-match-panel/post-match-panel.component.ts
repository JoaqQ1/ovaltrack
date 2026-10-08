import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchReviewStore } from '../../store/match-review.store';

@Component({
  selector: 'app-post-match-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match-panel.component.html',
  styleUrl: './post-match-panel.component.css'
})
export class PostMatchPanelComponent {
  readonly store = inject(MatchReviewStore);

  onNextPendingClick(): void {
    this.store.selectNextPending();
  }
}
