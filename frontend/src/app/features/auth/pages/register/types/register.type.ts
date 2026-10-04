import { User } from "src/app/features/user/types/user.types";
import { UserRole } from "../../../types/auth.types";

export type RegistrationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'NEEDS_INFORMATION';


export interface RegistrationRequest {
    email: string,
    password: string,
    requestedRole: UserRole;
    applicantFirstName: string;
    applicantLastName: string;
    applicantBirthDate: string; // Formato "YYYY-MM-DD"
    requestedClubName?: string;
    requestedClubCity?: string;
    requestedClubContactEmail?: string;
    requestedClubContactPhone?: string;
    clubId?: string;
    status?: RegistrationRequestStatus;
    decisionComment?: string;
    decidedBy?: User;
    createdAt?: string; // ISO string / Date string
    decidedAt?: string;
}