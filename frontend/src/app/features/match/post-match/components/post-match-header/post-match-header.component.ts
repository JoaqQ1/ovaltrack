import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-match-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match-header.component.html',
  styleUrl: './post-match-header.component.css'
})
export class PostMatchHeaderComponent {
  @Input() ownClubName = 'Mi Club';
  @Input() opponentName = 'Rival';
  @Input() homeScore = 0;
  @Input() awayScore = 0;
  @Input() scoreDelta: { text: string; type: 'OWN' | 'OPPONENT' } | null = null;
  @Input() startTimeFormatted = '15:30:00';
  @Input() statusLabel = 'Final';

  @Output() back = new EventEmitter<void>();
  @Output() addEvent = new EventEmitter<void>();

  onBack(): void {
    this.back.emit();
  }

  onAddEvent(): void {
    this.addEvent.emit();
  }
}
