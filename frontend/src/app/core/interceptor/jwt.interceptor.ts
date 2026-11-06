import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { SESSION_CLEANUP, runSessionCleanups } from '../session/session-cleanup';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);
    const sessionCleanups = inject(SESSION_CLEANUP, { optional: true }) ?? [];
    const token = tokenService.getToken();

    let clonedRequest = req;

    // Solo adjunta el encabezado si el token existe y la petición no va a endpoints públicos de auth
    if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
        clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si el backend devuelve 401 (token expirado o inválido)
            if (error.status === 401) {
                runSessionCleanups(sessionCleanups);
                tokenService.removeToken();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};