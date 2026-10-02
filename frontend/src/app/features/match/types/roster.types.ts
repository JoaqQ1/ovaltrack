export interface AvailablePlayer {
  id: string;
  fullName: string;
  jerseyNumber: number | null;
  position: string | null;
}

export interface RosterPayload {
  matchId: string;
  startingPlayers: string[];
  substitutePlayers: string[];
}

export interface SaveRosterRequestDTO {
  titularesIds: string[];
  suplentesIds: string[];
}

export interface BackendRosterResponse {
  startingPlayers?: string[];
  substitutePlayers?: string[];
  titularesIds?: string[];
  suplentesIds?: string[];
}

export interface SavedRoster {
  startingPlayers: string[];
  substitutePlayers: string[];
}