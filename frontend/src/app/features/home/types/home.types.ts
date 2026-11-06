import { UserRole } from "../../auth/types/auth.types";

/** Tarjeta del Inicio viejo; se elimina junto con la grilla "Ingresar al módulo" (Fase 2). */
export interface NavigationCard {
  title: string;
  description: string;
  route: string;
  badge: string;
  allowedRoles: UserRole[];
  icon: 'division' | 'live' | 'club' | 'player' | 'members';
}

/** Estado de un widget: cada tarjeta carga, falla y se reintenta sin afectar a las demás. */
export type WidgetState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; fetchedAt: number; stale: boolean }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export type PrimaryActionKind =
  | 'continue-capture'
  | 'go-halftime'
  | 'capture-live'
  | 'define-lineup'
  | 'complete-analysis'
  | 'schedule-match'
  | 'assign-coach'
  | 'create-division'
  | 'view-my-match';

/** Dónde se dibuja el único botón primario de la pantalla. */
export type PrimaryActionTarget = 'board' | 'debt-tile' | 'inbox-tile';

export interface PrimaryAction {
  kind: PrimaryActionKind;
  label: string;
  route: string;
  target: PrimaryActionTarget;
  /** Sin conexión queda deshabilitada con "Requiere conexión"; capturar nunca la necesita. */
  requiresConnection: boolean;
}

/** Contenido del tablero verde; `kind` decide la variante que dibuja `home-board`. */
export type BoardModel =
  | { kind: 'next'; matchId: string; divisionName: string; opponent: string; city: string | null; when: string; starters: number; substitutes: number; readyOffline: boolean }
  | { kind: 'match-day'; matchId: string; opponent: string; startsAt: Date }
  | { kind: 'live-here'; matchId: string; opponent: string; periodLabel: string; ownScore: number; opponentScore: number; halftime: boolean }
  | { kind: 'live-elsewhere'; matchId: string; opponent: string; ownScore: number; opponentScore: number; lastDataAt: string | null }
  | { kind: 'onboarding'; step: 'create-division' | 'schedule-match' | 'await-division' }
  | { kind: 'club-day'; day: 'today' | 'tomorrow' }
  | { kind: 'player-last'; matchId: string; opponent: string; ownScore: number; opponentScore: number };
