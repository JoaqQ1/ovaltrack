import { inject } from '@angular/core';
import { CanMatchFn, GuardResult, MaybeAsync, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Inverso de authGuard: con sesión vigente, login y registro redirigen al inicio (también al volver atrás).
 * Mira el token y no `currentUser`: si venció o el backend respondió 401, el login tiene que seguir accesible.
 */
export const guestGuard: CanMatchFn = (): MaybeAsync<GuardResult> => {
  const router = inject(Router);
  return inject(TokenService).isAuthenticated() ? router.createUrlTree(['/home']) : true;
};
