import { UserResponseDTO } from 'src/app/features/user/types/user.types';
import { Club } from '../../club/types/club.types';

export interface UserClubRegistration {
    user: UserResponseDTO,
    club: Club
}