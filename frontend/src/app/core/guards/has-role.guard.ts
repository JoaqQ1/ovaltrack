import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { CurrentUserSession, UserRole } from 'src/app/features/auth/types/auth.types';

export const hasRoleGuard: CanActivateFn = (route, state) => {
  const router: Router = inject(Router);
  const roles: UserRole[] = route.data?.["roles"] as UserRole[];
  const currentUser: CurrentUserSession | null = inject(AuthService).currentUser();
  if (currentUser === null) {
    router.navigate(["/auth/login"])
    return false;
  }
  if (!roles.includes(currentUser?.role)) {
    router.navigate(["/home"])
    return false;
  }
  return true;
};
