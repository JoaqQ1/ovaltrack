import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { isModuleActive } from '../../../../core/navigation/is-module-active';
import { NavigationModulesService } from '../../../../core/navigation/navigation-modules.service';
import { NavModule } from '../../../../core/navigation/navigation.types';

/** Lista de módulos del rol actual, con el de la pantalla actual resaltado. */
@Component({
  selector: 'app-nav-modules',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="modules">
      @for (module of modules(); track module.id) {
        <li>
          <a
            class="module"
            [routerLink]="module.route"
            [class.active]="isActive(module)"
            [attr.aria-current]="isActive(module) ? 'page' : null"
          >
            <i class="bi {{ module.icon }}" aria-hidden="true"></i>
            <span>{{ module.label }}</span>
          </a>
        </li>
      }
    </ul>
  `,
  styleUrl: './nav-modules.component.css'
})
export class NavModulesComponent {
  private readonly router = inject(Router);
  readonly modules = inject(NavigationModulesService).modules;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isActive(module: NavModule): boolean {
    return isModuleActive(module, this.url());
  }
}
