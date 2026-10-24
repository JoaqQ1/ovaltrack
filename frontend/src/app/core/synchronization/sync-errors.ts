import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

/**
 * - `retryable`: fallo transitorio (sin red, timeout, 408/429, 5xx); se reintenta más tarde.
 * - `auth`: sesión vencida o sin permisos; se reintenta tras volver a autenticarse.
 * - `rejected`: el servidor rechazó la operación; reintentarla tal cual no la hará pasar.
 */
export type SyncFailureKind = 'retryable' | 'auth' | 'rejected';

export function classifySyncError(error: unknown): SyncFailureKind {
  if (error instanceof TimeoutError) {
    return 'retryable';
  }

  if (!(error instanceof HttpErrorResponse)) {
    return 'retryable';
  }

  const { status } = error;
  if (status === 0 || status === 408 || status === 429 || status >= 500) {
    return 'retryable';
  }

  if (status === 401 || status === 403) {
    return 'auth';
  }

  return 'rejected';
}

export function isRetryableSyncError(error: unknown): boolean {
  return classifySyncError(error) === 'retryable';
}

/** Extrae el `{ message }` estándar del backend, si existe. */
export function readSyncErrorMessage(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : null;
}
