import { User, UserResponseDTO } from 'src/app/features/user/types/user.types';
import { UserRole } from '../../types/auth.types';
import { RegistrationRequestStatus } from '../../pages/register/types/register.type';

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
    status: RegistrationRequestStatus;
    decisionComment: string | null;
    createdAt: string;
    decidedBy?:User
}


export interface OvalTrackAdminOverview {
    registrationRequests: RegistrationRequest[];
    accounts: UserResponseDTO[];
}