export interface DivisionPlayerResponse {
  id: string;
  personId: string;
  divisionId: string;
  jerseyNumber: number;
  position: string;
  startDate: string;
  endDate: string | null;
}

//just a reference, use registerPlayer with a form instead
export interface DivisionPlayerCreationRequest {
  divisionId: string;
  personId: string;
}
