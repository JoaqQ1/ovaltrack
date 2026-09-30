import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string, title?: string, durationMs?: number): string {
    const id = crypto.randomUUID();
    const effectiveDuration = durationMs !== undefined ? durationMs : (type === 'error' ? 7000 : 4500);

    const newToast: Toast = {
      id,
      type,
      title,
      message,
      durationMs: effectiveDuration
    };

    this.toasts.update(current => [...current, newToast]);

    if (effectiveDuration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, effectiveDuration);
    }

    return id;
  }

  success(message: string, title = 'Operación exitosa', durationMs = 4000): string {
    return this.show('success', message, title, durationMs);
  }

  error(message: string, title = 'Error', durationMs = 7000): string {
    return this.show('error', message, title, durationMs);
  }

  warning(message: string, title = 'Atención', durationMs = 5000): string {
    return this.show('warning', message, title, durationMs);
  }

  info(message: string, title = 'Información', durationMs = 4000): string {
    return this.show('info', message, title, durationMs);
  }

  dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
