import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';
import { NAV_MODULES } from './navigation-modules';
import { NavModule } from './navigation.types';

/** Resuelve qué módulos de la barra corresponden al rol del usuario autenticado. */
@Injectable({ providedIn: 'root' })
export class NavigationModulesService {
  private readonly authService = inject(AuthService);

  readonly modules = computed<NavModule[]>(() => {
    const role = this.authService.effectiveRole();
    if (!role) {
      return [];
    }
    return NAV_MODULES.filter(module => module.route !== null && module.roles.includes(role));
  });
}
