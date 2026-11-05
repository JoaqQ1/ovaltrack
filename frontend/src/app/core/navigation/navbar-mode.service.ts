import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { NavbarMode } from './navigation.types';

/** Modo de la barra según `data.navbar` de la ruta activa (la hoja hereda el de sus padres). */
@Injectable({ providedIn: 'root' })
export class NavbarModeService {
  private readonly router = inject(Router);

  private readonly routeMode = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.resolveMode()),
    ),
    { initialValue: this.resolveMode() },
  );

  readonly mode = computed<NavbarMode>(() => this.routeMode());
  readonly isCompact = computed(() => this.mode() === 'compact');
  readonly isHidden = computed(() => this.mode() === 'hidden');

  private resolveMode(): NavbarMode {
    let route = this.router.routerState.snapshot?.root;
    let mode: NavbarMode = 'default';
    while (route) {
      const declared = route.data?.['navbar'];
      if (declared === 'default' || declared === 'compact' || declared === 'hidden') {
        mode = declared;
      }
      route = route.firstChild as typeof route;
    }
    return mode;
  }
}
