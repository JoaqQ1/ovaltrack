export interface PersonResponse {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

export interface PersonCreationRequest {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export type PersonUpdateRequest = PersonCreationRequest;