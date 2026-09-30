import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodStatisticDTO } from '../../../types/statistic.types';

@Component({
  selector: 'ot-halftime-stats-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './halftime-stats-modal.component.html',
  styleUrl: './halftime-stats-modal.component.css'
})
export class HalftimeStatsModalComponent {
  @Input() stats: PeriodStatisticDTO | null = null;
  @Input() homeTeam: string = 'PMRC';
  @Input() awayTeam: string = 'Rival';
  @Input() isLoading: boolean = false;
  @Input() isOffline: boolean = false;
  @Input() theme: 'light' | 'dark' = 'light';

  @Output() closeModal = new EventEmitter<void>();
  @Output() startSecondHalf = new EventEmitter<void>();

  get opponentPossessionPercentage(): number {
    if (!this.stats) return 50;
    return Math.max(0, Math.round((100 - this.stats.ownPossessionPercentage) * 10) / 10);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onStartSecondHalf(): void {
    this.startSecondHalf.emit();
  }
}
