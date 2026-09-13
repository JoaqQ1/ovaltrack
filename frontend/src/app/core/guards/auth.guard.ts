import { inject } from '@angular/core';
import { CanMatchFn, GuardResult, MaybeAsync, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanMatchFn = (route, segments): MaybeAsync<GuardResult> => {
  const router: Router = inject(Router);
  const authService = inject(AuthService);
  if (authService.currentUser() === null) {
    router.navigate(["/auth/login"])
    return false;
  }
  return true;
};
