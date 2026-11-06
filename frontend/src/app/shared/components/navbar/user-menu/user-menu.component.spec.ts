import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { SyncStatusSource } from '../../../../core/navigation/sync-status.source';
import { SyncRetryResult, SyncStatus } from '../../../../core/navigation/navigation.types';
import { ToastService } from '../../../../core/services/toast.service';
import { UserContextService } from '../../../../core/services/user-context.service';
import { UserMenuComponent } from './user-menu.component';

describe('UserMenuComponent (cierre de sesión)', () => {
  const status = signal<SyncStatus>({ state: 'synced', pendingCount: 0 });
  let retryResult: SyncRetryResult;
  let authService: jasmine.SpyObj<AuthService>;
  let component: UserMenuComponent;

  beforeEach(() => {
    status.set({ state: 'synced', pendingCount: 0 });
    retryResult = 'done';
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
      currentUser: signal({ id: 'u-1', email: 'ana@club.org', role: 'ADMIN_CLUB' }),
      effectiveRole: signal('ADMIN_CLUB'),
    });

    TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: UserContextService,
          useValue: {
            userContext: signal(null),
            fullName: signal('Ana Gómez'),
            currentClub: signal(null),
            currentRole: signal('ADMIN_CLUB'),
          },
        },
        { provide: SyncStatusSource, useValue: { status, retry: () => Promise.resolve(retryResult) } },
        { provide: ToastService, useValue: jasmine.createSpyObj<ToastService>('ToastService', ['warning']) },
      ],
    });
    const fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sin cambios pendientes también pide confirmar', () => {
    component.logout();

    expect(component.logoutDialogOpen()).toBeTrue();
    expect(authService.logout).not.toHaveBeenCalled();

    component.confirmLogout();

    expect(authService.logout).toHaveBeenCalled();
    expect(component.logoutDialogOpen()).toBeFalse();
  });

  it('con cambios pendientes abre la confirmación y no cierra sesión', () => {
    status.set({ state: 'offline', pendingCount: 3 });

    component.logout();

    expect(component.logoutDialogOpen()).toBeTrue();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('"Sincronizar y cerrar sesión" cierra solo si se envió todo', async () => {
    status.set({ state: 'pending', pendingCount: 3 });
    component.logout();

    await component.syncAndLogout();

    expect(authService.logout).toHaveBeenCalled();
    expect(component.logoutDialogOpen()).toBeFalse();
  });

  it('si quedan cambios después de sincronizar, el diálogo sigue abierto con el aviso', async () => {
    status.set({ state: 'pending', pendingCount: 3 });
    retryResult = 'incomplete';
    component.logout();

    await component.syncAndLogout();

    expect(authService.logout).not.toHaveBeenCalled();
    expect(component.logoutDialogOpen()).toBeTrue();
    expect(component.logoutSyncFailed()).toBeTrue();
  });

  it('cancelar no cierra sesión', () => {
    status.set({ state: 'offline', pendingCount: 3 });
    component.logout();

    component.cancelLogout();

    expect(component.logoutDialogOpen()).toBeFalse();
    expect(authService.logout).not.toHaveBeenCalled();
  });
});
