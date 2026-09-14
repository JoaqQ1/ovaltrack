import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Component({
  selector: 'app-navbar-auth',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="navbar auth-navbar sticky-top px-3 py-2">
      <div class="container d-flex justify-content-between align-items-center">
        <!-- Brand Link al Home -->
        <a routerLink="/home" class="text-decoration-none d-flex align-items-center gap-2">
          <div class="brand-icon d-flex align-items-center justify-content-center">
            O
          </div>
          <span class="fw-bold text-white tracking-wide fs-5">OvalTrack</span>
        </a>

        <!-- Acciones a la derecha -->
        <div class="d-flex align-items-center gap-3">
          <a routerLink="/home" class="btn btn-outline-dark-theme btn-sm px-3 py-1 text-decoration-none d-inline-flex align-items-center gap-1">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Volver al inicio</span>
          </a>

          @if (currentUser(); as user) {
            <div class="d-flex align-items-center gap-2">
              <span class="status-dot"></span>
              <span class="badge-role text-uppercase">{{ user.role }}</span>
            </div>
          }

          <button
            type="button"
            class="btn btn-outline-danger-custom btn-sm px-3 py-1"
            (click)="logout()"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .auth-navbar {
      background-color: rgba(11, 17, 30, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #1f2e47;
      z-index: 1030;
    }

    .brand-icon {
      width: 34px;
      height: 34px;
      background-color: #162238;
      border: 1px solid #2a3c5a;
      color: #a3e635;
      font-weight: 700;
      border-radius: 8px;
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
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .btn-outline-dark-theme {
      background-color: #131c2e;
      border: 1px solid #2a3c5a;
      color: #cbd5e1;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-outline-dark-theme:hover {
      background-color: #1a273e;
      border-color: #3b82f6;
      color: #ffffff;
    }

    .btn-outline-danger-custom {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-outline-danger-custom:hover {
      background-color: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }

    .container {
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .tracking-wide {
      letter-spacing: 0.5px;
    }
  `]
})
export class NavbarAuthComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
