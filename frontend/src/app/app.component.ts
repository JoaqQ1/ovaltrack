import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { SyncManagerService } from './core/synchronization/SyncManagerService';
import { LayoutService } from './core/services/layout.service';
import { NavbarModeService } from './core/navigation/navbar-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly layout = inject(LayoutService);
  readonly navbarMode = inject(NavbarModeService);

  constructor() {
    // Se inyecta al arrancar para que el sincronizador offline quede activo desde el inicio.
    inject(SyncManagerService);
  }

  get showNavbar(): boolean {
    return !this.navbarMode.isHidden();
  }
}
