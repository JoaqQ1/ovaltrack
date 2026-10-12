import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore, RUGBY_HALF_TIME_MIN } from '../../store/match-review.store';
import { ReviewEventViewModel, ReviewPeriodFilter } from '../../types/match-review.types';

@Component({
  selector: 'app-post-match-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-match-timeline.component.html',
  styleUrl: './post-match-timeline.component.css'
})
export class PostMatchTimelineComponent {
  readonly store = inject(MatchReviewStore);
  readonly halfTimeMin = RUGBY_HALF_TIME_MIN;

  getTooltip(occ: ReviewEventViewModel): string {
    const player = occ.hasPlayer ? occ.playerName : 'Sin jugador asignado';
    return `${occ.matchTimeFormatted} • ${occ.eventTypeName} (${player})`;
  }

  // Eje de marcas en minutos calculado dinámicamente
  readonly timelineTicks = computed<number[]>(() => {
    const max = this.store.matchDurationScale();
    const ticks: number[] = [];
    for (let i = 0; i <= max; i += 10) {
      ticks.push(i);
    }
    // Asegurar que el entretiempo esté presente si el partido es de al menos dicha duración
    if (max >= this.halfTimeMin && !ticks.includes(this.halfTimeMin)) {
      ticks.push(this.halfTimeMin);
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
