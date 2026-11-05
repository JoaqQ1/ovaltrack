import {
  ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, viewChild
} from '@angular/core';

/**
 * Confirmación de cierre de sesión, siempre: sin conexión no se puede volver a iniciar sesión (el login necesita
 * el servidor), así que salir por error deja a la persona afuera. Modal bloqueante (`<dialog>` nativo, capa superior
 * e inerte el resto). Con cambios sin enviar: con red propone sincronizar antes de salir; sin red, la acción segura
 * es seguir conectado.
 */
@Component({
  selector: 'app-logout-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="dialog"
      role="alertdialog"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
      (cancel)="onEscape($event)"
    >
      <div class="head" [class.head--warning]="hasPending()">
        <span class="head-icon" aria-hidden="true">
          <i class="bi" [class.bi-exclamation-triangle]="hasPending()" [class.bi-box-arrow-right]="!hasPending()"></i>
        </span>
        <h2 id="logout-dialog-title">
          @if (hasPending()) {
            Tenés {{ pendingCount() }} {{ changesLabel() }} sin enviar
          } @else {
            ¿Cerrar sesión?
          }
        </h2>
      </div>

      @if (!hasPending()) {
        <p id="logout-dialog-desc">
          Para volver a entrar vas a necesitar conexión a internet.
          @if (!online()) {
            <strong>Ahora no tenés conexión.</strong>
          }
        </p>
      } @else if (online()) {
        <p id="logout-dialog-desc">
          Si cerrás sesión ahora, quedan guardados en este dispositivo y no se envían hasta que vuelvas a entrar.
          Sincronizalos antes de salir.
        </p>
      } @else {
        <p id="logout-dialog-desc">
          <strong>Sin conexión no vas a poder volver a iniciar sesión</strong>, y estos cambios no se envían
          hasta que entres de nuevo con internet.
        </p>
      }

      @if (syncFailed() && online()) {
        <p class="error" role="alert">
          No se pudieron enviar todos los cambios. Podés reintentar o cerrar sesión sin enviarlos.
        </p>
      }

      <div class="actions">
        @if (!hasPending()) {
          <button type="button" class="btn-outline" autofocus (click)="cancel.emit()">Cancelar</button>
          <button type="button" class="btn-danger-solid" (click)="logout.emit()">Cerrar sesión</button>
        } @else if (online()) {
          <button type="button" class="btn-outline" [disabled]="syncing()" (click)="cancel.emit()">Cancelar</button>
          <button type="button" class="btn-danger-text" [disabled]="syncing()" (click)="logout.emit()">Cerrar sin enviar</button>
          <button type="button" class="btn-invite" autofocus [disabled]="syncing()" (click)="syncAndLogout.emit()">
            {{ syncing() ? 'Sincronizando…' : 'Sincronizar y cerrar sesión' }}
          </button>
        } @else {
          <button type="button" class="btn-danger-outline" (click)="logout.emit()">Cerrar sesión igual</button>
          <button type="button" class="btn-invite" autofocus (click)="cancel.emit()">Seguir conectado</button>
        }
      </div>
    </dialog>
  `,
  styleUrl: './logout-confirm-dialog.component.css'
})
export class LogoutConfirmDialogComponent {
  readonly open = input.required<boolean>();
  readonly pendingCount = input.required<number>();
  readonly online = input.required<boolean>();
  readonly syncing = input(false);
  readonly syncFailed = input(false);

  readonly cancel = output<void>();
  readonly logout = output<void>();
  readonly syncAndLogout = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly hasPending = computed(() => this.pendingCount() > 0);
  readonly changesLabel = computed(() => (this.pendingCount() === 1 ? 'cambio' : 'cambios'));

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  /** Esc equivale a cancelar (salvo mientras sincroniza); el cierre lo decide quien abre el diálogo. */
  onEscape(event: Event): void {
    event.preventDefault();
    if (!this.syncing()) {
      this.cancel.emit();
    }
  }
}
