import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectCurrentUrl } from '../../../../core/navigation/current-url';
import { isModuleActive } from '../../../../core/navigation/is-module-active';
import { NavigationModulesService } from '../../../../core/navigation/navigation-modules.service';
import { NavModule } from '../../../../core/navigation/navigation.types';

/**
 * Lista de módulos del rol actual, con el de la pantalla actual resaltado.
 * `top` es la fila de la barra superior; `bottom` es la barra inferior del celular (icono sobre texto).
 */
@Component({
  selector: 'app-nav-modules',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="modules" [class.modules--bottom]="variant() === 'bottom'" [class.modules--icons]="iconOnly()">
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
  readonly variant = input<'top' | 'bottom'>('top');
  /** Solo íconos (el texto sigue disponible para lectores de pantalla): barra inferior compactada. */
  readonly iconOnly = input(false);
  readonly modules = inject(NavigationModulesService).modules;

  private readonly url = injectCurrentUrl();

  isActive(module: NavModule): boolean {
    return isModuleActive(module, this.url());
  }
}
