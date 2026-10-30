import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Acción opcional del toast (ej. "Deshacer"): corre al tocar el botón y el toast se cierra. */
export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
  action?: ToastAction;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private activeTimer: ReturnType<typeof setTimeout> | null = null;

  show(type: ToastType, message: string, title?: string, durationMs?: number, action?: ToastAction): string {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    const id = crypto.randomUUID();
    const effectiveDuration = durationMs !== undefined ? durationMs : (type === 'error' ? 7000 : 4500);

    const newToast: Toast = {
      id,
      type,
      title,
      message,
      durationMs: effectiveDuration,
      action
    };

    // Opción A: Siempre un único toast a la vez (reemplazo inmediato)
    this.toasts.set([newToast]);

    if (effectiveDuration > 0) {
      this.activeTimer = setTimeout(() => {
        this.dismiss(id);
        this.activeTimer = null;
      }, effectiveDuration);
    }

    return id;
  }

  success(message: string, title = 'Operación exitosa', durationMs = 4000, action?: ToastAction): string {
    return this.show('success', message, title, durationMs, action);
  }

  error(message: string, title = 'Error', durationMs = 7000, action?: ToastAction): string {
    return this.show('error', message, title, durationMs, action);
  }

  warning(message: string, title = 'Atención', durationMs = 5000, action?: ToastAction): string {
    return this.show('warning', message, title, durationMs, action);
  }

  info(message: string, title = 'Información', durationMs = 4000, action?: ToastAction): string {
    return this.show('info', message, title, durationMs, action);
  }

  dismiss(id: string): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    this.toasts.set([]);
  }
}
