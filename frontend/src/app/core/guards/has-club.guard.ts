import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { UserContextService } from '../services/user-context.service';

export const hasClubGuard: CanActivateFn = () => {
  const userContextService = inject(UserContextService);
  const router = inject(Router);

  const context = userContextService.userContext();
  if (context !== null) {
    if (userContextService.hasClub()) {
      return true;
    }
    return router.createUrlTree(['/home']);
  }

  return userContextService.loadUserContext().pipe(
    map(loadedContext => {
      if (loadedContext?.role === 'ADMIN_OVALTRACK' || (loadedContext?.club !== null && loadedContext?.club !== undefined)) {
        return true;
      }
      return router.createUrlTree(['/home']);
    })
  );
};
