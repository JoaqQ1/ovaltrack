import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, fromEvent } from 'rxjs';
import { LiveMatchSummary } from '../../../../core/navigation/navigation.types';
import { NavLiveMatchComponent } from '../nav-live-match/nav-live-match.component';
import { NavModulesComponent } from '../nav-modules/nav-modules.component';

/** Distancia mínima de scroll para cambiar de estado (evita parpadeos por movimientos chicos). */
const SCROLL_THRESHOLD = 8;
/** Desde esta posición la barra puede compactarse. */
const COMPACT_AFTER = 48;

/**
 * Barra inferior flotante del celular: módulos con icono y texto y, encima, el partido en vivo.
 * Se compacta (solo íconos) al bajar y vuelve a su tamaño al subir. Solo se ve con 700px o menos.
 */
@Component({
  selector: 'app-mobile-tab-bar',
  standalone: true,
  imports: [NavModulesComponent, NavLiveMatchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack">
      @if (liveMatch(); as match) {
        <app-nav-live-match [match]="match" variant="bar" />
      }
      <nav class="tabbar" [class.tabbar--compact]="compact()" aria-label="Módulos">
        <app-nav-modules variant="bottom" [iconOnly]="compact()" />
      </nav>
    </div>
  `,
  styleUrl: './mobile-tab-bar.component.css'
})
export class MobileTabBarComponent {
  readonly liveMatch = input<LiveMatchSummary | null>(null);
  readonly compact = signal(false);

  private lastScrollY = typeof window === 'undefined' ? 0 : window.scrollY;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    fromEvent(window, 'scroll', { passive: true })
      .pipe(auditTime(80), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.onScroll(window.scrollY));
  }

  private onScroll(scrollY: number): void {
    const delta = scrollY - this.lastScrollY;
    if (scrollY <= COMPACT_AFTER) {
      this.compact.set(false);
    } else if (delta > SCROLL_THRESHOLD) {
      this.compact.set(true);
    } else if (delta < -SCROLL_THRESHOLD) {
      this.compact.set(false);
    }
    if (Math.abs(delta) > SCROLL_THRESHOLD) {
      this.lastScrollY = scrollY;
    }
  }
}
