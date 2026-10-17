import { UUID } from './common.types';

export type Actor = 'ATTACKING' | 'DEFENDING' | 'CHOOSE';
export type PossessionAfter = 'KEEP' | 'ACTOR' | 'OTHER';

/** Evento que se puede elegir como siguiente al guardar otro (p. ej. cómo se juega un penal). */
export interface FollowUpChoice {
  code: string;
  label?: string;
  /** Valores que se pre-llenan en el evento elegido (se salta ese paso). */
  preset?: Record<string, unknown>;
}

export interface TemplateOption {
  value: string;
  label: string;
  /** Posesión resultante al elegir esta opción (pisa la del tipo). */
  possession?: PossessionAfter;
  /** Botonera de eventos siguientes al elegir esta opción. */
  followUps?: FollowUpChoice[];
}

export interface BackendEventTypeResponse {
  id: UUID;
  name: string;
  groupName: string | null;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | 'SET_PIECE' | null;
  isScoring: boolean;
  points: number | null;
  requiresPlayer: boolean;
  code: string;
  showInPalette: boolean;
  followUpEventTypeId: string | null;
  actor: Actor;
  possessionAfter: PossessionAfter;
  followUpChoices: FollowUpChoice[];
  templateEventFields: TemplateField[];
}

export interface TemplateField {
  key: string; label: string;
  type: 'select' | 'number' | 'boolean';
  phase: 'live' | 'post';
  required: boolean;
  options?: TemplateOption[];
  min?: number; max?: number;
  default?: unknown;
  effects?: ('scoring' | 'possession')[];
  trueLabel?: string;
  falseLabel?: string;
}

export type LiveCaptureEventType = Omit<BackendEventTypeResponse,
  'groupName' | 'category' | 'isScoring' | 'points' | 'requiresPlayer'
> & {
  groupName: string;
  category: 'ATTACK' | 'DEFENSE' | 'NEUTRAL' | 'POSSESSION' | 'SET_PIECE';
  isScoring: boolean;
  points: number;
  requiresPlayer: boolean;
  isActive: boolean;
  createdAt: string;
};