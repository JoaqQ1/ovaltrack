import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarAuthComponent } from 'src/app/shared/components/navbar-auth/navbar-auth.component';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { DivisionService } from 'src/app/services/division.service';

@Component({
  selector: 'app-division-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarAuthComponent],
  templateUrl: './division-form.component.html',
  styleUrl: './division-form.component.css'
})
export class DivisionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly divisionService = inject(DivisionService);
  readonly userContext = inject(UserContextService);

  divisionDetails!: FormGroup;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  readonly myClub = this.userContext.currentClub;

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  getClubCrest(): string {
    const name = this.myClub()?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : 'O';
  }

  closeSuccess(): void {
    this.mensajeExito = '';
  }

  closeError(): void {
    this.mensajeError = '';
  }

  iniciarFormulario(): void {
    this.divisionDetails = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ageCategory: ['', Validators.required],
      gender: ['', Validators.required]
    });
  }

  guardarDivision(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    const club = this.myClub();
    if (!club?.id) {
      this.mensajeError = 'No se puede crear una división sin un club asignado.';
      return;
    }

    if (this.divisionDetails.valid) {
      this.guardando = true;
      const payload = {
        ...this.divisionDetails.value,
        clubId: club.id
      };

      this.divisionService.createDivision(payload).subscribe({
        next: () => {
          this.mensajeExito = '¡División creada con éxito!';
          this.divisionDetails.reset({
            name: '',
            ageCategory: '',
            gender: ''
          });
          this.guardando = false;
        },
        error: (err) => {
          console.error('Error al crear la división', err);
          this.mensajeError = typeof err.error === 'string' ? err.error : 'Error al crear la división.';
          this.guardando = false;
        }
      });
    } else {
      this.divisionDetails.markAllAsTouched();
    }
  }
}
