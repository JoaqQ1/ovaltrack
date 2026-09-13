import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarAuthComponent } from 'src/app/shared/components/navbar-auth/navbar-auth.component';
import { DivisionService } from 'src/app/services/division.service';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-division-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarAuthComponent],
  templateUrl: './division-details.component.html',
  styleUrl: './division-details.component.css'
})
export class DivisionDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly divisionService = inject(DivisionService);
  private readonly clubService = inject(ClubService);

  divisionDetails!: FormGroup;
  myClub: any = null;
  cargandoClub: boolean = false;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  ngOnInit(): void {
    this.iniciarFormulario();
    this.cargarMiClub();
  }

  getClubCrest(): string {
    const name = this.myClub?.name?.trim();
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

  cargarMiClub(): void {
    this.cargandoClub = true;
    this.clubService.getMyClub().subscribe({
      next: (club) => {
        this.myClub = club;
        this.cargandoClub = false;
      },
      error: (err) => {
        console.error('Error al cargar el club del usuario', err);
        this.mensajeError = 'No se pudo obtener la información de tu club.';
        this.cargandoClub = false;
      }
    });
  }

  guardarDivision(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.divisionDetails.valid) {
      this.guardando = true;
      const payload = {
        ...this.divisionDetails.value,
        clubId: this.myClub?.id
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