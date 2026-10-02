import { UserRole } from '../../types/auth.types';

export interface PendingRegistrationRequest {
  requestId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  requestedRole: UserRole;
  clubId: string | null;
  clubName: string | null;
  status: 'PENDING' | 'NEEDS_INFORMATION';
  createdAt: string;
}

export interface ActivePlatformAccount {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface OvalTrackAdminOverview {
  pendingRequests: PendingRegistrationRequest[];
  activeAccounts: ActivePlatformAccount[];
}