import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="navbar-wrapper sticky-top">
      <nav class="navbar-global" [class.landing-nav]="isLanding">
        <div class="container d-flex justify-content-between align-items-center">
          <!-- Brand Link al Home -->
          <a routerLink="/home" class="brand-link">
            <div class="brand-icon">
              {{ userContextService.currentClub()?.name ? userContextService.currentClub()!.name.charAt(0).toUpperCase() : 'O' }}
            </div>
            <div class="brand-info">
              <span class="brand-title">OvalTrack</span>
              @if (userContextService.currentClub()?.name) {
                <small class="brand-subtitle">{{ userContextService.currentClub()!.name }}</small>
              }
            </div>
          </a>

          <!-- Acciones según estado de autenticación -->
          <div class="navbar-actions">
            <!-- Botón de alternancia Modo Claro / Oscuro -->
            <button
              type="button"
              class="btn-theme-toggle"
              (click)="themeService.toggleTheme()"
              [attr.aria-label]="themeService.theme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              [title]="themeService.theme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            >
              @if (themeService.theme() === 'dark') {
                <!-- Ícono de Sol para pasar a claro -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              } @else {
                <!-- Ícono de Luna para pasar a oscuro -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              }
            </button>

            @if (currentUser(); as user) {
              <!-- Acciones Autenticadas -->
              <a routerLink="/home" class="btn-outline-dark-theme btn-nav-action" *ngIf="currentUrl !== '/home' && currentUrl !== '/'">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>Volver al inicio</span>
              </a>

              <div class="user-role-badge">
                <span class="status-dot"></span>
                <span class="badge-role">{{ user.role }}</span>
              </div>

              <button
                type="button"
                class="btn-outline-danger-custom btn-nav-action"
                (click)="logout()"
              >
                Cerrar sesión
              </button>
            } @else {
              <!-- Acciones Públicas / No Autenticadas -->
              <a routerLink="/home" class="btn-outline-dark-theme btn-nav-action" *ngIf="currentUrl !== '/home' && currentUrl !== '/'">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>Volver al inicio</span>
              </a>

              @if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
                <a routerLink="/auth/register" class="btn-neon btn-nav-action">
                  Crear cuenta
                </a>
              } @else if (currentUrl.includes('/auth/register') || currentUrl.includes('/register')) {
                <a routerLink="/auth/login" class="btn-neon btn-nav-action">
                  Iniciar sesión
                </a>
              } @else {
                <a routerLink="/auth/login" class="btn-outline-dark-theme btn-nav-action">
                  Iniciar sesión
                </a>
                <a routerLink="/auth/register" class="btn-neon btn-nav-action">
                  Crear cuenta
                </a>
              }
            }
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 1030;
      width: 100%;
    }

    .navbar-global {
      background-color: #0b111e;
      border-bottom: 1px solid #1f2e47;
      min-height: 64px;
      padding: 8px 0;
      display: flex;
      align-items: center;
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .navbar-global.landing-nav {
      border-bottom: 1px solid transparent;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      background-color: #162238;
      border: 1px solid #2a3c5a;
      color: #a3e635;
      font-weight: 700;
      font-size: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .brand-info {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.25rem;
      color: #ffffff;
      line-height: 1.1;
      letter-spacing: 0.5px;
      transition: color 0.2s ease;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      color: #94a3b8;
      line-height: 1;
      margin-top: 3px;
      transition: color 0.2s ease;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-theme-toggle {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background-color: #131c2e;
      border: 1px solid #2a3c5a;
      color: #a3e635;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .btn-theme-toggle:hover {
      background-color: #1a273e;
      border-color: #3b82f6;
      color: #ffffff;
      transform: scale(1.05);
    }

    .user-role-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: #a3e635;
      border-radius: 50%;
      box-shadow: 0 0 8px #a3e635;
      transition: all 0.2s ease;
    }

    .badge-role {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      transition: color 0.2s ease;
    }

    .btn-nav-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 38px;
      padding: 0 16px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-outline-dark-theme {
      background-color: #131c2e;
      border: 1px solid #2a3c5a;
      color: #cbd5e1;
    }

    .btn-outline-dark-theme:hover {
      background-color: #1a273e;
      border-color: #3b82f6;
      color: #ffffff;
    }

    .btn-neon {
      background-color: #a3e635;
      color: #0b111e;
      font-weight: 600;
      border: none;
    }

    .btn-neon:hover {
      background-color: #bef264;
      color: #0b111e;
      box-shadow: 0 0 14px rgba(163, 230, 53, 0.35);
    }

    .btn-outline-danger-custom {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .btn-outline-danger-custom:hover {
      background-color: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }

    @media (max-width: 600px) {
      .brand-subtitle,
      .user-role-badge {
        display: none;
      }
    }

    /* ==========================================================================
       Modo Claro en Navbar: Verde Deportivo Suave (#d6e6d0) Liso con Borde Firme #204b22
       ========================================================================== */
    :host-context([data-theme="light"]) .navbar-global,
    :host-context(.light-theme) .navbar-global {
      background-color: #d6e6d0;
      border-bottom: 2px solid #204b22;
      box-shadow: 0 4px 14px rgba(20, 45, 20, 0.08);
    }

    :host-context([data-theme="light"]) .navbar-global.landing-nav,
    :host-context(.light-theme) .navbar-global.landing-nav {
      background-color: #d6e6d0;
      border-bottom: 2px solid #204b22;
      box-shadow: 0 4px 14px rgba(20, 45, 20, 0.08);
    }

    :host-context([data-theme="light"]) .brand-title,
    :host-context(.light-theme) .brand-title {
      color: #142410;
    }

    :host-context([data-theme="light"]) .brand-subtitle,
    :host-context(.light-theme) .brand-subtitle {
      color: #4a6042;
    }

    :host-context([data-theme="light"]) .brand-icon,
    :host-context(.light-theme) .brand-icon {
      background-color: #204b22;
      border: 1px solid #2a5f2e;
      color: #d6f2c4;
      font-weight: 700;
    }

    :host-context([data-theme="light"]) .btn-theme-toggle,
    :host-context(.light-theme) .btn-theme-toggle {
      background-color: #ffffff;
      border: 1px solid rgba(32, 75, 34, 0.25);
      color: #204b22;
    }

    :host-context([data-theme="light"]) .btn-theme-toggle:hover,
    :host-context(.light-theme) .btn-theme-toggle:hover {
      background-color: #f2f7ef;
      border-color: #204b22;
      color: #142e15;
    }

    :host-context([data-theme="light"]) .user-role-badge,
    :host-context(.light-theme) .user-role-badge {
      background-color: #ffffff;
      border: 1px solid rgba(32, 75, 34, 0.25);
      border-radius: 999px;
      padding: 4px 12px;
    }

    :host-context([data-theme="light"]) .badge-role,
    :host-context(.light-theme) .badge-role {
      color: #204b22;
      font-weight: 700;
    }

    :host-context([data-theme="light"]) .status-dot,
    :host-context(.light-theme) .status-dot {
      background-color: #204b22;
      box-shadow: 0 0 6px rgba(32, 75, 34, 0.4);
    }

    :host-context([data-theme="light"]) .btn-outline-dark-theme,
    :host-context(.light-theme) .btn-outline-dark-theme {
      background-color: #ffffff;
      border: 1px solid rgba(32, 75, 34, 0.25);
      color: #204b22;
      font-weight: 600;
    }

    :host-context([data-theme="light"]) .btn-outline-dark-theme:hover,
    :host-context(.light-theme) .btn-outline-dark-theme:hover {
      background-color: #f2f7ef;
      border-color: #204b22;
      color: #142e15;
    }

    :host-context([data-theme="light"]) .btn-neon,
    :host-context(.light-theme) .btn-neon {
      background-color: #204b22;
      color: #ffffff;
      font-weight: 700;
    }

    :host-context([data-theme="light"]) .btn-neon:hover,
    :host-context(.light-theme) .btn-neon:hover {
      background-color: #173819;
      box-shadow: 0 4px 14px rgba(32, 75, 34, 0.22);
    }

    :host-context([data-theme="light"]) .btn-outline-danger-custom,
    :host-context(.light-theme) .btn-outline-danger-custom {
      background-color: #204b22;
      border: 1px solid #204b22;
      color: #ffffff;
      font-weight: 600;
      border-radius: 8px;
    }

    :host-context([data-theme="light"]) .btn-outline-danger-custom:hover,
    :host-context(.light-theme) .btn-outline-danger-custom:hover {
      background-color: #163618;
      border-color: #163618;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(32, 75, 34, 0.20);
    }
  `]
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly userContextService = inject(UserContextService);
  readonly themeService = inject(ThemeService);
  readonly currentUser = this.authService.currentUser;

  currentUrl = this.router.url;

  get isLanding(): boolean {
    const url = this.currentUrl.split('?')[0];
    return (url === '/home' || url === '/' || url === '') && !this.currentUser();
  }

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.urlAfterRedirects || event.url;
      });
  }

  logout(): void {
    this.authService.logout();
  }
}
