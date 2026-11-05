import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveMatchSummary } from '../../../../core/navigation/navigation.types';

/** Acceso al partido en vivo: división y marcador; lleva de vuelta a la captura. */
@Component({
  selector: 'app-nav-live-match',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="live" [routerLink]="['/live-capture', match().matchId]" [attr.aria-label]="ariaLabel()">
      <span class="dot" aria-hidden="true"></span>
      <span class="live-label">En vivo</span>
      <span class="live-score">{{ match().divisionLabel }} {{ match().homeScore }}–{{ match().awayScore }}</span>
    </a>
  `,
  styleUrl: './nav-live-match.component.css'
})
export class NavLiveMatchComponent {
  readonly match = input.required<LiveMatchSummary>();

  readonly ariaLabel = computed(() => {
    const { divisionLabel, homeScore, awayScore } = this.match();
    return `Partido en vivo, ${divisionLabel}, ${homeScore} a ${awayScore}. Volver a la captura`;
  });
}
