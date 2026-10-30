import { Component, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { RUGBY_HALF_TIME_MIN } from '../../utils/match-review.utils';
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

  /** Acción primaria de la vista: abrir el alta de un evento post-partido. */
  readonly addEvent = output<void>();

  getTooltip(occ: ReviewEventViewModel): string {
    if (occ.isUnassigned) {
      return `${occ.matchTimeFormatted} • ${occ.eventTypeName} (Sin jugador asignado • Clic para inspeccionar)`;
    }
    const playerInfo = occ.hasPlayer ? ` • ${occ.playerName}` : (occ.teamPossession === 'OPPONENT' ? ' • Rival' : '');
    return `${occ.matchTimeFormatted} • ${occ.eventTypeName}${playerInfo}`;
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

  getShortLabel(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('infracción') || lower.includes('penal')) {
      if (lower.includes('palos')) return 'Penal palos';
      return 'Infracción';
    }
    if (lower.includes('tackle')) {
      if (lower.includes('fallado')) return 'Tackle ✗';
      return 'Tackle ✓';
    }
    if (lower.includes('drop')) return 'Drop';
    return name;
  }
}

