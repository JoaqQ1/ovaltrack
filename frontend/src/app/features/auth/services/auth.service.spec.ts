import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TokenService } from '../../../core/services/token.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserContextService } from '../../../core/services/user-context.service';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { TokenPayload, UserRole } from '../types/auth.types';
import { AuthService } from './auth.service';

describe('AuthService.effectiveRole', () => {
  const contextRole = signal<UserRole | null>(null);
  let payload: TokenPayload | null;

  function effectiveRole(): UserRole | null {
    return TestBed.inject(AuthService).effectiveRole();
  }

  beforeEach(() => {
    contextRole.set(null);
    payload = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TokenService, useValue: { isAuthenticated: () => payload !== null, getPayload: () => payload } },
        { provide: UserContextService, useValue: { currentRole: contextRole, loadUserContext: () => of(null) } },
        { provide: LocalDatabaseService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
    });
  });

  it('sin sesión no hay rol', () => {
    expect(effectiveRole()).toBeNull();
  });

  it('usa el rol del token mientras el contexto no cargó', () => {
    payload = { sub: 'ana@club.org', userId: 'u-1', role: 'PLAYER', exp: 0, iat: 0 };
    expect(effectiveRole()).toBe('PLAYER');
  });

  it('el rol del contexto manda sobre el del token', () => {
    payload = { sub: 'ana@club.org', userId: 'u-1', role: 'PLAYER', exp: 0, iat: 0 };
    contextRole.set('COACH_ANALYST');
    expect(effectiveRole()).toBe('COACH_ANALYST');
  });
});
