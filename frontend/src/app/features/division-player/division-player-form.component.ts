import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarAuthComponent } from 'src/app/shared/components/navbar-auth/navbar-auth.component';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { DivisionService } from 'src/app/services/division.service';
import { DivisionPlayerService } from 'src/app/services/division-player.service';
import { Division } from '../division/types/division.types';

@Component({
  selector: 'app-division-player-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarAuthComponent],
  templateUrl: './division-player-form.component.html',
  styleUrl: './division-player-form.component.css'
})
export class DivisionPlayerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly divisionService = inject(DivisionService);
  private readonly playerService = inject(DivisionPlayerService);
  readonly userContext = inject(UserContextService);

  playerForm!: FormGroup;
  readonly divisiones = signal<Division[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  mensajeExito = '';
  mensajeError = '';

  private autoDismissTimer: any = null;

  readonly currentClub = this.userContext.currentClub;

  ngOnInit(): void {
    this.iniciarFormulario();
    this.cargarDatosContextuales();
  }

  getClubCrest(): string {
    const name = this.currentClub()?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : 'O';
  }

  closeSuccess(): void {
    this.mensajeExito = '';
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  closeError(): void {
    this.mensajeError = '';
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  iniciarFormulario(): void {
    this.playerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: [''],
      contactEmail: ['', [Validators.email]],
      contactPhone: [''],
      divisionId: ['', Validators.required],
      jerseyNumber: [null, [Validators.min(1), Validators.max(99)]],
      position: ['', Validators.required]
    });

    // Limpiar errores de servidor al modificar los campos
    this.playerForm.get('contactEmail')?.valueChanges.subscribe(() => {
      const control = this.playerForm.get('contactEmail');
      if (control?.hasError('serverError')) {
        const errors = { ...control.errors };
        delete errors['serverError'];
        control.setErrors(Object.keys(errors).length ? errors : null);
      }
    });

    this.playerForm.get('contactPhone')?.valueChanges.subscribe(() => {
      const control = this.playerForm.get('contactPhone');
      if (control?.hasError('serverError')) {
        const errors = { ...control.errors };
        delete errors['serverError'];
        control.setErrors(Object.keys(errors).length ? errors : null);
      }
    });
  }

  cargarDatosContextuales(): void {
    const club = this.currentClub();
    if (!club?.id) {
      this.cargando.set(false);
      this.mensajeError = 'No se encontró un club asignado a tu usuario.';
      return;
    }

    this.cargando.set(true);
    this.divisionService.getDivisiones(club.id).subscribe({
      next: (divs) => {
        this.divisiones.set(divs);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar divisiones', err);
        this.cargando.set(false);
      }
    });
  }

  guardarJugador(): void {
    this.closeSuccess();
    this.closeError();

    if (this.playerForm.valid) {
      this.guardando.set(true);
      const val = this.playerForm.value;

      const payload = {
        divisionId: val.divisionId,
        firstName: val.firstName?.trim(),
        lastName: val.lastName?.trim(),
        birthDate: val.birthDate || null,
        contactEmail: val.contactEmail?.trim() || null,
        contactPhone: val.contactPhone?.trim() || null,
        jerseyNumber: val.jerseyNumber ? Number(val.jerseyNumber) : null,
        position: val.position || null
      };

      this.playerService.registerPlayer(payload).subscribe({
        next: () => {
          this.mensajeExito = 'Jugador creado y asignado a la división exitosamente.';
          this.iniciarFormulario();
          this.guardando.set(false);

          this.autoDismissTimer = setTimeout(() => {
            this.mensajeExito = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al registrar jugador', err);
          const errorMsg = typeof err.error === 'string'
            ? err.error
            : (err.error?.message || 'Error al guardar el jugador.');

          this.mensajeError = errorMsg;
          this.guardando.set(false);

          // Asignar error in-line y focus al campo conflictivo
          if (errorMsg.toLowerCase().includes('email')) {
            const emailCtrl = this.playerForm.get('contactEmail');
            emailCtrl?.setErrors({ serverError: 'Email ya registrado' });
            emailCtrl?.markAsTouched();
            const emailInput = document.getElementById('contactEmail');
            emailInput?.focus();
          } else if (errorMsg.toLowerCase().includes('teléfono') || errorMsg.toLowerCase().includes('telefono')) {
            const phoneCtrl = this.playerForm.get('contactPhone');
            phoneCtrl?.setErrors({ serverError: 'Teléfono ya registrado' });
            phoneCtrl?.markAsTouched();
            const phoneInput = document.getElementById('contactPhone');
            phoneInput?.focus();
          }

          this.autoDismissTimer = setTimeout(() => {
            this.mensajeError = '';
          }, 5000);
        }
      });
    } else {
      this.playerForm.markAllAsTouched();
    }
  }
}
