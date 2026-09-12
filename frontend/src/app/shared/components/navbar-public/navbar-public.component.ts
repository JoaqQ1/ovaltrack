import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar-public',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="public-navbar sticky-top px-3 py-2">
      <div class="container d-flex justify-content-between align-items-center">
        <!-- Brand Link al Home -->
        <a routerLink="/home" class="text-decoration-none d-flex align-items-center gap-2">
          <div class="brand-icon d-flex align-items-center justify-content-center">
            O
          </div>
          <span class="fw-bold text-white tracking-wide fs-5">OvalTrack</span>
        </a>

        <!-- Acciones a la derecha -->
        <div class="d-flex align-items-center gap-2">
          <a routerLink="/home" class="btn btn-outline-dark-theme btn-sm px-3 py-1 text-decoration-none d-inline-flex align-items-center gap-1">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Volver al inicio</span>
          </a>

          @if (currentView() === 'login') {
            <a routerLink="/auth/register" class="btn btn-neon btn-sm px-3 py-1 text-decoration-none">
              Crear cuenta
            </a>
          } @else if (currentView() === 'register') {
            <a routerLink="/auth/login" class="btn btn-neon btn-sm px-3 py-1 text-decoration-none">
              Iniciar sesión
            </a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .public-navbar {
      background-color: rgba(11, 17, 30, 0.9);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #1f2e47;
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

    .btn-neon {
      background-color: #a3e635;
      color: #0b111e;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-neon:hover {
      background-color: #bef264;
      color: #0b111e;
      box-shadow: 0 0 14px rgba(163, 230, 53, 0.35);
    }
  `]
})
export class NavbarPublicComponent {
  readonly currentView = input<'login' | 'register' | 'landing'>('landing');
}