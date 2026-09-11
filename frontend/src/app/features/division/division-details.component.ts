import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DivisionService } from 'src/app/services/division.service';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-division-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './division-details.component.html'
})
export class DivisionDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private divisionService = inject(DivisionService);
  private clubService = inject(ClubService);

  divisionDetails!: FormGroup;
  myClub: any = null;
  cargandoClub: boolean = false;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  ngOnInit() {
    this.iniciarFormulario();
    this.cargarMiClub();
  }

  iniciarFormulario() {
    this.divisionDetails = this.fb.group({
      name: ['', Validators.required],
      ageCategory: ['', Validators.required],
      gender: ['', Validators.required]
    });
  }

  cargarMiClub() {
    this.cargandoClub = true;
    this.errorClub = '';
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

  guardarDivision() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.divisionDetails.valid) {
      this.guardando = true;
      const payload = {
        ...this.divisionDetails.value,
        clubId: this.myClub?.id
      };

      this.divisionService.createDivision(payload).subscribe({
        next: (res) => {
          this.mensajeExito = '¡División creada con éxito!';
          this.divisionDetails.reset();
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

  private errorClub: string = '';
}