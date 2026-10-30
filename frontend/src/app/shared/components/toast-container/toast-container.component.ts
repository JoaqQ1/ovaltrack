import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  /** Cierra el toast antes de correr la acción, así un toast nuevo (ej. un error) no se pisa. */
  runAction(toast: Toast): void {
    this.toastService.dismiss(toast.id);
    toast.action?.handler();
  }
}
