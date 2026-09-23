export interface DivisionCoachResponse {
  id: string;
  personId: string;
  divisionId: string;
  startDate: string;
  endDate: string | null;
}

export interface DivisionCoachCreationRequest {
  divisionId: string;
  personId: string;
}

