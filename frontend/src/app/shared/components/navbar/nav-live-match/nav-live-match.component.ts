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
    <a class="live" [class.live--bar]="variant() === 'bar'" [routerLink]="['/live-capture', match().matchId]" [attr.aria-label]="ariaLabel()">
      <span class="dot" aria-hidden="true"></span>
      <span class="live-label">En vivo</span>
      <span class="live-score"><span class="live-division">{{ match().divisionLabel }}</span> {{ match().homeScore }}–{{ match().awayScore }}</span>
      @if (variant() === 'bar') {
        <i class="bi bi-chevron-right live-chevron" aria-hidden="true"></i>
      }
    </a>
  `,
  styleUrl: './nav-live-match.component.css'
})
export class NavLiveMatchComponent {
  readonly match = input.required<LiveMatchSummary>();
  /** `pill` es la píldora de la barra superior; `bar` es la píldora ancha sobre la barra inferior del celular. */
  readonly variant = input<'pill' | 'bar'>('pill');

  readonly ariaLabel = computed(() => {
    const { divisionLabel, homeScore, awayScore } = this.match();
    return `Partido en vivo, ${divisionLabel}, ${homeScore} a ${awayScore}. Volver a la captura`;
  });
}
