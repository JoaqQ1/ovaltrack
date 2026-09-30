import { UUID } from './common.types';
import { Possession } from './live-capture.types';

export interface BackendEventResponse {
  id: UUID;
  clientEventId?: UUID | null;
  eventTypeId: UUID;
  matchId: UUID;
  playerId: UUID | null;
  teamPossession: Possession;
  matchTime: number | null;
  realTime: string | null;
  period: number | null;
  origin: string | null;
  attributes: Record<string, unknown> | null;
  createdAt: string;
  synchronizedAt: string | null;
}

export interface BackendEventCreationRequest {
  eventTypeId: UUID;
  matchId: UUID;
  clientEventId?: UUID | null;
  playerId?: UUID | null;
  teamPossession?: Possession | null;
  matchTime?: number | null;
  realTime?: string | null;
  period?: number | null;
  origin?: string | null;
  attributes?: Record<string, unknown>;
  synchronizedAt?: string | null;
}

export interface LocalMatchEvent extends BackendEventResponse {
  localSequence: number;
}