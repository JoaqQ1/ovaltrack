import { UserRole } from '../../auth/types/auth.types';

export interface User {
  id: string;
  loginEmail: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
}
export interface UserResponseDTO {
    id: string;
    email: string;
    role: UserRole;
    active: boolean;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
}

export type SaveUserRequest = Omit<User, 'id' | 'createdAt'>;
