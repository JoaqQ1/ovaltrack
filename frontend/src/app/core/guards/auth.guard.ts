import { inject } from '@angular/core';
import { CanMatchFn, GuardResult, MaybeAsync } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanMatchFn = (route, segments): MaybeAsync<GuardResult> => {
  const authService = inject(AuthService);
  if (authService.currentUser() === null) {
    return false
  }
  return true;
};
