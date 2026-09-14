import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContext, UserRole } from '../../features/auth/types/auth.types';
import { ClubSummary, Division } from '../../features/division/types/division.types';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly contextSignal = signal<UserContext | null>(null);
  readonly userContext = this.contextSignal.asReadonly();
  readonly currentClub = computed<ClubSummary | null>(() => this.contextSignal()?.club ?? null);
  readonly currentRole = computed<UserRole | null>(() => this.contextSignal()?.role ?? null);
  readonly activeDivisions = computed<Division[]>(() => this.contextSignal()?.activeDivisions ?? []);

  loadUserContext(): Observable<UserContext | null> {
    return this.http.get<UserContext>(`${this.apiUrl}/api/me`).pipe(
      tap(ctx => this.contextSignal.set(ctx)),
      catchError(err => {
        console.error('Error al cargar el contexto de usuario:', err);
        this.contextSignal.set(null);
        return of(null);
      })
    );
  }

  setContext(context: UserContext | null): void {
    this.contextSignal.set(context);
  }

  clear(): void {
    this.contextSignal.set(null);
  }
}
