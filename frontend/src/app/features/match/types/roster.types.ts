export interface RosterPayload {
  matchId: string;
  startingPlayers: string[];
  substitutePlayers: string[];
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