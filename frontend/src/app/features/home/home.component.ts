import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { UserContextService } from '../../core/services/user-context.service';
import { LandingComponent } from './landing/landing.component';
import { AdminHomeComponent } from './views/admin/admin-home.component';
import { CoachHomeComponent } from './views/coach/coach-home.component';
import { OtherHomeComponent } from './views/other/other-home.component';
import { PlayerHomeComponent } from './views/player/player-home.component';

export type HomeView = 'coach' | 'admin' | 'player' | 'other';

/** Inicio: la landing sin sesión y, con sesión, la vista que corresponde al rol del usuario. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LandingComponent, CoachHomeComponent, AdminHomeComponent, PlayerHomeComponent, OtherHomeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly currentUser = inject(AuthService).currentUser;
  private readonly userContext = inject(UserContextService).userContext;

  /** `null` mientras llega el contexto del usuario: sin él no se sabe qué división o club mostrar. */
  readonly view = computed<HomeView | null>(() => {
    switch (this.userContext()?.role) {
      case undefined: return null;
      case 'COACH_ANALYST': return 'coach';
      case 'ADMIN_CLUB': return 'admin';
      case 'PLAYER': return 'player';
      default: return 'other';
    }
  });
}
