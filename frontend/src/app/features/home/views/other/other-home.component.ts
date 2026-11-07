import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../../../core/services/user-context.service';
import { HomeHudComponent } from '../../components/hud/home-hud.component';
import { greetingFor, hudDateLabel } from '../../domain/greeting';

/** Inicio de los roles sin panel propio: administrador de la plataforma y cuenta sin rol asignado. */
@Component({
  selector: 'app-other-home',
  standalone: true,
  imports: [RouterLink, HomeHudComponent],
  templateUrl: './other-home.component.html',
  styleUrl: './other-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtherHomeComponent {
  private readonly userContext = inject(UserContextService);

  readonly isPlatformAdmin = computed(() => this.userContext.currentRole() === 'ADMIN_OVALTRACK');
  readonly label = computed(() => `${hudDateLabel(new Date())} · ${this.isPlatformAdmin() ? 'Plataforma' : 'Mi cuenta'}`);
  readonly title = computed(() => `${greetingFor(new Date())}, ${this.userContext.userContext()?.firstName ?? ''}`.replace(/,\s*$/, ''));
}
