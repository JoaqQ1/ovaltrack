import { TestBed } from '@angular/core/testing';
import { CanMatchFn, Route, Router, UrlTree } from '@angular/router';

import { TokenService } from '../services/token.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let authenticated: boolean;

  const executeGuard: CanMatchFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({
      providers: [{ provide: TokenService, useValue: { isAuthenticated: () => authenticated } }]
    });
  });

  it('deja pasar a quien no tiene sesión vigente', () => {
    expect(executeGuard({} as Route, [])).toBeTrue();
  });

  it('redirige al inicio a quien ya inició sesión', () => {
    authenticated = true;

    const result = executeGuard({} as Route, []);

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/home');
  });
});
