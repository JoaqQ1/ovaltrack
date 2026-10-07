import { UUID } from './common.types';

export interface BackendEventTypeResponse {
  id: UUID;
  name: string;
  groupName: string | null;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | 'SET_PIECE' | null;
  affectsPossession: boolean;
  isScoring: boolean;
  points: number | null;
  requiresPlayer: boolean;
  templateEventFields: Record<string, unknown> | null;
}

export type LiveCaptureEventType = Omit<BackendEventTypeResponse,
  'groupName' | 'category' | 'affectsPossession' | 'isScoring' | 'points' | 'requiresPlayer'
> & {
  groupName: string;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | 'POSSESSION' | 'SET_PIECE';
  affectsPossession: boolean;
  isScoring: boolean;
  points: number;
  requiresPlayer: boolean;
  isActive: boolean;
  createdAt: string;
};