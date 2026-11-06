import '@angular/compiler';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { SESSION_CLEANUP } from '../session/session-cleanup';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let cleanups: jasmine.Spy[];
  let tokenService: { getToken: jasmine.Spy; removeToken: jasmine.Spy };
  let router: { navigate: jasmine.Spy };
  let injector: Injector;

  function intercept(next: () => Observable<unknown>): Observable<unknown> {
    const request = new HttpRequest('GET', '/matches');
    return runInInjectionContext(injector, () =>
      jwtInterceptor(request, next as never)
    );
  }

  beforeEach(() => {
    cleanups = [jasmine.createSpy('a'), jasmine.createSpy('b')];
    tokenService = { getToken: jasmine.createSpy().and.returnValue('jwt'), removeToken: jasmine.createSpy() };
    router = { navigate: jasmine.createSpy() };
    injector = Injector.create({
      providers: [
        { provide: TokenService, useValue: tokenService },
        { provide: Router, useValue: router },
        ...cleanups.map(cleanup => ({ provide: SESSION_CLEANUP, useValue: cleanup, multi: true })),
      ],
    });
  });

  it('ante un 401 ejecuta todas las limpiezas, borra el token y va al login', done => {
    const unauthorized = new HttpErrorResponse({ status: 401 });

    intercept(() => throwError(() => unauthorized)).subscribe({
      error: error => {
        expect(error).toBe(unauthorized);
        cleanups.forEach(cleanup => expect(cleanup).toHaveBeenCalledTimes(1));
        expect(tokenService.removeToken).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      },
    });
  });

  it('un error que no es 401 no limpia nada', done => {
    intercept(() => throwError(() => new HttpErrorResponse({ status: 500 }))).subscribe({
      error: () => {
        cleanups.forEach(cleanup => expect(cleanup).not.toHaveBeenCalled());
        expect(tokenService.removeToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('una respuesta correcta no limpia nada', done => {
    intercept(() => of(new HttpResponse({ status: 200 }))).subscribe(() => {
      cleanups.forEach(cleanup => expect(cleanup).not.toHaveBeenCalled());
      done();
    });
  });
});
