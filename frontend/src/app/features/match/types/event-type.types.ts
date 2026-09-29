import { UUID } from './common.types';

export interface BackendEventTypeResponse {
  id: UUID;
  name: string;
  groupName: string | null;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | null;
  affectsPossession: boolean | null;
  isScoring: boolean | null;
  points: number | null;
  requiresPlayer: boolean | null;
  templateEventFields: Record<string, unknown> | null;
  createdAt: string;
  active: boolean | null;
}

export type LiveCaptureEventType = Omit<BackendEventTypeResponse,
  'groupName' | 'category' | 'affectsPossession' | 'isScoring' | 'points' | 'requiresPlayer' | 'active'
> & {
  groupName: string;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | 'POSSESSION' | 'SET_PIECE';
  affectsPossession: boolean;
  isScoring: boolean;
  points: number;
  requiresPlayer: boolean;
  active: boolean;
};