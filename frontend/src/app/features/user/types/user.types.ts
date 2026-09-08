import { UserRole } from '../../auth/types/auth.types';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export type SaveUserRequest = Omit<User, 'id' | 'createdAt'>;
