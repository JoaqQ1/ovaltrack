import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { LiveMatchSource } from 'src/app/core/navigation/live-match.source';
import { NavbarModeService } from 'src/app/core/navigation/navbar-mode.service';
import { SyncStatusSource } from 'src/app/core/navigation/sync-status.source';
import { ThemeService } from 'src/app/core/services/theme.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { NavLiveMatchComponent } from './nav-live-match/nav-live-match.component';
import { NavModulesComponent } from './nav-modules/nav-modules.component';
import { MobileTabBarComponent } from './mobile-tab-bar/mobile-tab-bar.component';
import { NavSyncStatusComponent } from './nav-sync-status/nav-sync-status.component';
import { UserMenuComponent } from './user-menu/user-menu.component';

/**
 * Barra superior: orquesta logo, módulos, estados y menú de usuario.
 * No contiene lógica de negocio; cada parte es un componente que recibe sus datos.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NavModulesComponent, NavLiveMatchComponent, NavSyncStatusComponent, UserMenuComponent, MobileTabBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly userContext = inject(UserContextService);
  readonly themeService = inject(ThemeService);
  readonly navbarMode = inject(NavbarModeService);
  readonly currentUser = inject(AuthService).currentUser;
  readonly syncStatus = inject(SyncStatusSource).status;

  private readonly liveMatchSource = inject(LiveMatchSource);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly clubName = computed(() => this.userContext.currentClub()?.name ?? null);

  /** El jugador no captura partidos: no ve el acceso al partido en vivo. */
  readonly liveMatch = computed(() =>
    this.currentUser()?.role === 'PLAYER' ? null : this.liveMatchSource.liveMatch()
  );

  readonly isLanding = computed(() => {
    const path = this.currentUrl().split('?')[0];
    return (path === '/home' || path === '/' || path === '') && !this.currentUser();
  });

  readonly authPage = computed<'login' | 'register' | null>(() => {
    const url = this.currentUrl();
    if (url.includes('/login')) return 'login';
    if (url.includes('/register')) return 'register';
    return null;
  });
}
