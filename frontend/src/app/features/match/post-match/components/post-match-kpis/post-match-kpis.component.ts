import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchReviewStore } from '../../store/match-review.store';

@Component({
  selector: 'app-post-match-kpis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match-kpis.component.html',
  styleUrl: './post-match-kpis.component.css'
})
export class PostMatchKpisComponent {
  readonly store = inject(MatchReviewStore);
}
