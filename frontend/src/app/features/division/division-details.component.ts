import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DivisionService } from 'src/app/services/division.service';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-division-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './division-details.component.html'
})
export class DivisionDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private divisionService = inject(DivisionService);
  private clubService = inject(ClubService);

  divisionDetails!: FormGroup;
  clubes: any[] = [];

  ngOnInit() {
    this.iniciarFormulario();
    this.cargarClubes();
  }

  iniciarFormulario() {
    this.divisionDetails = this.fb.group({
      clubId: ['', Validators.required],
      name: ['', Validators.required],
      ageCategory: ['', Validators.required],
      gender: ['', Validators.required]
    });
  }

  cargarClubes() {
    this.clubService.getClubes().subscribe({
      next: (data) => this.clubes = data,
      error: (err) => console.error('Error al cargar clubes', err)
    });
  }

  guardarDivision() {
    if (this.divisionDetails.valid) {
      this.divisionService.createDivision(this.divisionDetails.value).subscribe({
        next: (res) => {
          console.log('División creada con éxito', res);
          this.divisionDetails.reset();
        },
        error: (err) => console.error('Error al crear la división', err)
      });
    } else {
      this.divisionDetails.markAllAsTouched();
    }
  }
}