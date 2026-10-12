export interface AvailablePlayer {
  id: string;
  fullName: string;
  jerseyNumber: number | null;
  position: string | null;
}

export type RosterStep = 'titulares' | 'suplentes';

export type RugbyPositionCategory =
  | 'primera_linea'
  | 'segunda_linea'
  | 'tercera_linea'
  | 'medios'
  | 'backs'
  | 'suplente';

export interface RugbySlotDefinition {
  readonly number: number;
  readonly positionName: string;
  readonly positionCategory: RugbyPositionCategory;
  readonly isStarter: boolean;
}

export interface RosterSlot {
  readonly number: number;
  readonly positionName: string;
  readonly positionCategory: RugbyPositionCategory;
  readonly isStarter: boolean;
  player: AvailablePlayer | null;
}

export interface RosterValidationResult {
  readonly isValid: boolean;
  readonly startingCount: number;
  readonly substituteCount: number;
  readonly missingStartingCount: number;
  readonly message?: string;
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