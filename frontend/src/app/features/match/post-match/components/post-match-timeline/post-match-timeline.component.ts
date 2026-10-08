import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { ReviewPeriodFilter } from '../../types/match-review.types';

@Component({
  selector: 'app-post-match-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-match-timeline.component.html',
  styleUrl: './post-match-timeline.component.css'
})
export class PostMatchTimelineComponent {
  readonly store = inject(MatchReviewStore);

  // Eje de marcas en minutos calculado dinámicamente
  readonly timelineTicks = computed<number[]>(() => {
    const max = this.store.matchDurationScale();
    const ticks: number[] = [];
    for (let i = 0; i <= max; i += 10) {
      ticks.push(i);
    }
    // Asegurar que 40 (entretiempo) esté presente si el partido es de al menos 40'
    if (max >= 40 && !ticks.includes(40)) {
      ticks.push(40);
      ticks.sort((a, b) => a - b);
    }
    return ticks;
  });

  readonly selectedEventPct = computed<number | null>(() => {
    const selected = this.store.selectedEvent();
    return selected ? selected.pct : null;
  });

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setSearchTerm(input.value);
  }

  setPeriod(period: ReviewPeriodFilter): void {
    this.store.setPeriod(period);
  }
}
