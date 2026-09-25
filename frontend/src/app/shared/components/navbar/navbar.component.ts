import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="navbar-global sticky-top" [class.landing-nav]="isLanding">
      <div class="nav-container">
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
    </header>
  `,
  styles: [`
    .navbar-global {
      background-color: #0b111e;
      position: sticky;
      top: 0;
      z-index: 1030;
      border-bottom: 1px solid #1f2e47;
      min-height: 62px;
      display: flex;
      align-items: center;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .navbar-global.landing-nav {
      border-bottom: 1px solid transparent;
    }

    .nav-container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
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
    }

    .brand-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      color: #94a3b8;
      line-height: 1;
      margin-top: 3px;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-role-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: #a3e635;
      border-radius: 50%;
      box-shadow: 0 0 8px #a3e635;
    }

    .badge-role {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
      text-transform: uppercase;
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
      .nav-container {
        padding: 8px 16px;
      }
      .brand-subtitle,
      .user-role-badge {
        display: none;
      }
    }

    /* Soporte preparado para modo claro cuando data-theme="light" se active */
    :host-context([data-theme="light"]) .navbar-global,
    :host-context(.light-theme) .navbar-global {
      background-color: rgba(255, 255, 255, 0.95);
      border-bottom: 1px solid rgba(27, 33, 22, 0.10);
    }

    :host-context([data-theme="light"]) .brand-title,
    :host-context(.light-theme) .brand-title {
      color: #1b2116;
    }

    :host-context([data-theme="light"]) .brand-subtitle,
    :host-context(.light-theme) .brand-subtitle {
      color: #7c8571;
    }

    :host-context([data-theme="light"]) .brand-icon,
    :host-context(.light-theme) .brand-icon {
      background: linear-gradient(155deg, #91da40, #6fae1f);
      border-color: rgba(90, 150, 30, 0.45);
      color: #1d3700;
    }

    :host-context([data-theme="light"]) .btn-outline-dark-theme,
    :host-context(.light-theme) .btn-outline-dark-theme {
      background-color: #eef1e7;
      border-color: rgba(27, 33, 22, 0.15);
      color: #1b2116;
    }

    :host-context([data-theme="light"]) .btn-outline-dark-theme:hover,
    :host-context(.light-theme) .btn-outline-dark-theme:hover {
      background-color: #e2e7d9;
      border-color: rgba(27, 33, 22, 0.25);
    }
  `]
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly userContextService = inject(UserContextService);
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
