export type ClubStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;

export interface Club {
  id: string;
  name: string;
  city: string;
  status?: ClubStatus;
  adminUserId?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ClubUpdateRequest {
  name: string;
  city: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ClubCreateRequest {
  name: string;
  city: string;
  adminUserId?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type ClubSummary = Club;
