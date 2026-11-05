import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender, computed, inject, signal, viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { ROLE_META } from '../../../../features/members/types/members.types';
import { getUserInitials } from '../../../../core/navigation/user-initials';
import { SyncStatusSource } from '../../../../core/navigation/sync-status.source';
import { ThemeService } from '../../../../core/services/theme.service';
import { UserContextService } from '../../../../core/services/user-context.service';

/** Ruta de "Mi perfil". Mientras sea `null` la opción no se muestra. */
const PROFILE_ROUTE: string | null = null;

/** Avatar con iniciales y menú de usuario: identidad, sincronización, apariencia y cierre de sesión. */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly authService = inject(AuthService);
  private readonly userContext = inject(UserContextService);
  private readonly syncSource = inject(SyncStatusSource);
  readonly themeService = inject(ThemeService);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly profileRoute = PROFILE_ROUTE;
  readonly isOpen = signal(false);
  readonly confirmingLogout = signal(false);
  readonly syncStatus = this.syncSource.status;

  readonly email = computed(() => this.userContext.userContext()?.email ?? this.authService.currentUser()?.email ?? '');
  readonly fullName = computed(() => this.userContext.fullName() || this.email());
  readonly initials = computed(() => getUserInitials(this.fullName(), this.email()));
  readonly clubName = computed(() => this.userContext.currentClub()?.name ?? null);
  readonly roleMeta = computed(() => {
    const role = this.userContext.currentRole() ?? this.authService.currentUser()?.role;
    return role ? ROLE_META[role] : null;
  });
  readonly hasPending = computed(() => this.syncStatus().pendingCount > 0);
  readonly isSyncing = computed(() => this.syncStatus().state === 'syncing');

  /** Lo usa la barra para abrir el menú al tocar el aviso de sincronización. */
  open(): void {
    this.isOpen.set(true);
    afterNextRender(() => this.panel()?.nativeElement.focus(), { injector: this.injector });
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close(false);
    } else {
      this.open();
    }
  }

  close(restoreFocus = true): void {
    this.isOpen.set(false);
    this.confirmingLogout.set(false);
    if (restoreFocus) {
      this.trigger()?.nativeElement.focus();
    }
  }

  retrySync(): void {
    void this.syncSource.retry();
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
  }

  /** Con eventos sin enviar pide confirmar antes de cerrar sesión. */
  logout(): void {
    if (this.hasPending() && !this.confirmingLogout()) {
      this.confirmingLogout.set(true);
      return;
    }
    this.close(false);
    this.authService.logout();
  }

  /** `pointerdown` (no `click`): así abrir el menú desde el aviso de sincronización no lo cierra al burbujear. */
  @HostListener('document:pointerdown', ['$event'])
  onOutsidePointer(event: PointerEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
