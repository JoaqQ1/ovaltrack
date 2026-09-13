import { UserRole } from "../../auth/types/auth.types";

export interface NavigationCard {
  title: string;
  description: string;
  route: string;
  badge: string;
  allowedRoles: UserRole[];
  icon: 'division' | 'live' | 'club' | 'player' | 'members';
}

