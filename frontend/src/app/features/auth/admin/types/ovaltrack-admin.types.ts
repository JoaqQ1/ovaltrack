import { UserRole } from '../../types/auth.types';
import { Club } from 'src/app/features/club/types/club.types';

export interface RegistrationRequest {
    id: string;
    user: { id: string; loginEmail: string };
    applicantFirstName: string | null;
    applicantLastName: string | null;
    applicantBirthDate: string | null;
    requestedRole: UserRole;
    requestedClubName: string | null;
    requestedClubCity: string | null;
    requestedClubContactEmail: string | null;
    requestedClubContactPhone: string | null;
    club: Club | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'NEEDS_INFORMATION';
    decisionComment: string | null;
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
    registrationRequests: RegistrationRequest[];
    activeAccounts: ActivePlatformAccount[];
}