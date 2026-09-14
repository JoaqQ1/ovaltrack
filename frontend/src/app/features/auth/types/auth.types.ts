export type UserRole = 'ADMIN_OVALTRACK' | 'ADMIN_CLUB' | 'COACH_ANALYST' | 'PLAYER' | 'NO_ROLE';


export interface RegistroRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string; // Formato YYYY-MM-DD
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface TokenPayload {
  sub: string;
  userId: string;
  role: UserRole;
  exp: number;
  iat: number;
}
export interface CurrentUserSession {
  id: string;
  email: string;
  role: UserRole;
}

export interface UserContext {
  userId: string;
  email: string;
  role: UserRole;
  personId?: string;
  firstName?: string;
  lastName?: string;
  club: import('../../division/types/division.types').ClubSummary | null;
  activeDivisions: import('../../division/types/division.types').Division[];
}
