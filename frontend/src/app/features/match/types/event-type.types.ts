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
  code: string;
  showInPalette: boolean;
  followUpEventTypeId: string | null;
  templateEventFields: TemplateField[];
}

export interface TemplateField {
  key: string; label: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  phase: 'live' | 'post';
  required: boolean;
  options?: {
    value: string;
    label: string
  }[];
  min?: number; max?: number;
  default?: unknown;
  effect?: 'scoring';
  trueLabel?: string;
  falseLabel?: string;
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