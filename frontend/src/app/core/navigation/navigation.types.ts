import { UserRole } from '../../features/auth/types/auth.types';

/** Entrada del catálogo de módulos de la barra de navegación. */
export interface NavModule {
  id: string;
  label: string;
  /** Clase de Bootstrap Icons (ej. `bi-house`). */
  icon: string;
  /** Ruta destino. `null` = el módulo aún no existe y no se muestra. */
  route: string | null;
  /** Roles que ven el módulo. */
  roles: readonly UserRole[];
  /** Prefijos de URL que también marcan el módulo como activo. */
  activeAlso?: readonly string[];
  /** Si es true, solo está activo con la URL exacta (ej. Inicio). */
  exact?: boolean;
}

export interface LiveMatchSummary {
  matchId: string;
  divisionLabel: string;
  homeScore: number;
  awayScore: number;
}

export type SyncState = 'synced' | 'pending' | 'syncing' | 'offline';

/**
 * Resultado de "Sincronizar ahora":
 * - `done`: no quedan cambios sin enviar.
 * - `incomplete`: se intentó, pero quedan cambios (servidor caído, sesión vencida...).
 * - `offline`: sin red; no se intentó.
 * - `busy`: ya había un reintento en curso.
 */
export type SyncRetryResult = 'done' | 'incomplete' | 'offline' | 'busy';

export interface SyncStatus {
  state: SyncState;
  pendingCount: number;
}

/**
 * Cómo se muestra la barra en una ruta:
 * - `default`: barra completa.
 * - `compact`: barra baja (post-partido).
 * - `hidden`: sin barra (captura en vivo y entretiempo).
 */
export type NavbarMode = 'default' | 'compact' | 'hidden';
