import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthResponse, CurrentUserSession, LoginRequest, RegistroRequest, TokenPayload } from '../types/auth.types';
import { environment } from '@environments/environment.docker';
import { TokenService } from '../../../core/services/token.service';
import { Observable, tap } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/api/auth`;
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private currentUserSignal = signal<CurrentUserSession | null>(this.loadUserFromToken());
  readonly currentUser = this.currentUserSignal.asReadonly();
  // readonly currentUserRole = this.currentUserSignal;

  constructor(private http: HttpClient) { }

  register(data: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuthSuccess(res.token))
    );
  }
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res.token))
    );
  }

  getErrorMessage(error: unknown, action: 'login' | 'register'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Inténtalo nuevamente.';
    }

    if (error.status === 400) {
      return this.readBackendMessage(error) ?? 'Los datos enviados no son válidos.';
    }

    if (error.status === 401 || error.status === 403) {
      return action === 'login'
        ? 'El correo o la contraseña no son correctos.'
        : 'No tienes permisos para realizar esta acción.';
    }

    if (error.status === 409) {
      return this.readBackendMessage(error) ?? 'Ya existe un usuario con ese correo.';
    }

    return 'No se pudo completar la operación. Inténtalo nuevamente.';
  }
  logout(): void {
    this.tokenService.removeToken();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  private handleAuthSuccess(token: string): void {
    this.tokenService.setToken(token);
    this.currentUserSignal.set(this.loadUserFromToken());
  }

  private loadUserFromToken(): CurrentUserSession | null {
    if (!this.tokenService.isAuthenticated()) {
      return null;
    }
    const payload: TokenPayload | null = this.tokenService.getPayload();
    if (!payload) return null;

    return {
      id: payload.userId,
      email: payload.sub,
      role: payload.role
    };
  }

  private readBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error && typeof error.error.message === 'string') {
      return error.error.message;
    }

    return null;
  }

}
