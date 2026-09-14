export type AgeCategory = 'SENIOR' | 'U20' | 'M19' | string;
export type Gender = 'MALE' | 'FEMALE' | 'MIXED' | string;

export interface Division {
  id: string;
  name: string;
  clubId: string;
  createdAt?: string;
  ageCategory: AgeCategory;
  gender: Gender;
  active: boolean;
}

export interface DivisionCreationRequest {
  clubId: string;
  name: string;
  ageCategory: AgeCategory;
  gender: Gender;
}

export interface DivisionUpdateRequest {
  name?: string;
  ageCategory?: AgeCategory;
  gender?: Gender;
  active?: boolean;
}

export interface ClubSummary {
  id: string;
  name: string;
  city?: string;
  status?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}
