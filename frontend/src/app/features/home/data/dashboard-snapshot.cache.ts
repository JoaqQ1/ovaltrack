import { Injectable } from '@angular/core';

const KEY_PREFIX = 'ovaltrack.home-snapshot:';

export interface Snapshot<T> {
  data: T;
  /** Cuándo se obtuvo del servidor (ms epoch); alimenta el sello "Datos de hh:mm". */
  fetchedAt: number;
}

/**
 * Última vista buena de cada widget del Inicio, por usuario, para mostrarla sin conexión.
 * Se guarda en localStorage (no en Dexie: no toca el esquema offline) y se borra con `SESSION_CLEANUP`.
 */
@Injectable({ providedIn: 'root' })
export class DashboardSnapshotCache {
  read<T>(userId: string, widget: string): Snapshot<T> | null {
    return (this.readAll(userId)[widget] as Snapshot<T> | undefined) ?? null;
  }

  write<T>(userId: string, widget: string, data: T, fetchedAt = Date.now()): void {
    try {
      localStorage.setItem(KEY_PREFIX + userId, JSON.stringify({ ...this.readAll(userId), [widget]: { data, fetchedAt } }));
    } catch {
      // Sin almacenamiento (cuota, modo privado) el Inicio funciona igual, solo sin vista offline.
    }
  }

  clear(userId: string): void {
    try {
      localStorage.removeItem(KEY_PREFIX + userId);
    } catch {
      // Nada que limpiar si el almacenamiento no está disponible.
    }
  }

  clearAll(): void {
    try {
      const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
      keys.filter((key): key is string => key !== null && key.startsWith(KEY_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch {
      // Nada que limpiar si el almacenamiento no está disponible.
    }
  }

  private readAll(userId: string): Record<string, Snapshot<unknown>> {
    try {
      return JSON.parse(localStorage.getItem(KEY_PREFIX + userId) ?? '{}') as Record<string, Snapshot<unknown>>;
    } catch {
      return {};
    }
  }
}
