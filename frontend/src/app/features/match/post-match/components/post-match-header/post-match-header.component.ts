import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ViewOption {
  label: string;
  icon: string;
  path: string[];
  exact: boolean;
}

/** Encabezado común de las tres vistas de análisis post-partido. Presentacional: los datos vienen del shell. */
@Component({
  selector: 'app-post-match-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './post-match-header.component.html',
  styleUrl: './post-match-header.component.css'
})
export class PostMatchHeaderComponent {
  @Input() matchId = '';
  @Input() ownClubName = 'Mi Club';
  @Input() opponentName = 'Rival';
  @Input() homeScore = 0;
  @Input() awayScore = 0;
  @Input() scoreDelta: { text: string; type: 'OWN' | 'OPPONENT' } | null = null;
  @Input() startTimeFormatted = '--:--:--';

  @Output() back = new EventEmitter<void>();

  get viewOptions(): ViewOption[] {
    const base = ['/post-match', this.matchId];
    return [
      { label: 'Eventos', icon: 'bi-list-ul', path: base, exact: true },
      { label: 'Zonas', icon: 'bi-grid-3x3-gap', path: [...base, 'zones'], exact: false },
      { label: 'Estadísticas', icon: 'bi-bar-chart-line', path: [...base, 'statistics'], exact: false }
    ];
  }

  onBack(): void {
    this.back.emit();
  }
}
