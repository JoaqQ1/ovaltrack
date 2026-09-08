import { Injectable } from '@angular/core';
import { TokenPayload } from '../../features/auth/types/auth.types';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';

  constructor() { }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  getPayload(): TokenPayload | null {
    const token = this.getToken();
    if (token === null || !token) return null;
    try {
      // Un JWT tiene el formato header.payload.signature
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as TokenPayload;
    } catch {
      return null;
    }
  }
  isAuthenticated(): boolean {
    const payload: TokenPayload | null = this.getPayload();
    if (payload === null || !payload || !payload.exp) return false;
    return Date.now() < payload.exp * 1000;
  }
}


