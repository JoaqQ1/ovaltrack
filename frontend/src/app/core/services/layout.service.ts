import { computed, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly router = inject(Router);

  private readonly manualOverride = signal<boolean | null>(null);

  private checkWide(): boolean {
    let r = this.router.routerState.snapshot?.root;
    while (r?.firstChild) {
      r = r.firstChild;
    }
    return r?.data?.['layout'] === 'wide';
  }

  private readonly routeWide = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.checkWide())
    ),
    { initialValue: this.checkWide() }
  );

  readonly isWide = computed(() => {
    const manual = this.manualOverride();
    return manual !== null ? manual : (this.routeWide() ?? false);
  });

  setWide(wide: boolean | null): void {
    this.manualOverride.set(wide);
  }
}
