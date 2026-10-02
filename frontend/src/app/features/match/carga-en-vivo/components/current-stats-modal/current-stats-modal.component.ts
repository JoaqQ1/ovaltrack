import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodStatisticDTO } from '../../../types/statistic.types';

@Component({
  selector: 'ot-current-stats-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-stats-modal.component.html',
  styleUrl: './current-stats-modal.component.css'
}) 
export class CurrentStatsModalComponent {
  @Input() stats: PeriodStatisticDTO | null = null;
  @Input() homeTeam: string = 'PMRC';
  @Input() awayTeam: string = 'Rival';
  @Input() isLoading: boolean = false;
  @Input() isOffline: boolean = false;
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() gameClock: string = '--:--';
  @Input() clockPaused: boolean = true;

  @Output() closeModal = new EventEmitter<void>();
  @Output() toggleClock = new EventEmitter<void>();
  //@Output() startSecondHalf = new EventEmitter<void>();

  get opponentPossessionPercentage(): number {
    if (!this.stats) return 50;
    return Math.max(0, Math.round((100 - this.stats.ownPossessionPercentage) * 10) / 10);
  }

  onClose(): void {
    this.closeModal.emit();
  }
/* 
  onStartSecondHalf(): void {
    this.startSecondHalf.emit();
  }
   */
}
