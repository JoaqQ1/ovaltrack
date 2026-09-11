import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DivisionService } from 'src/app/services/division.service';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-division-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './division-list.component.html'
})
export class DivisionListComponent implements OnInit {
  private divisionService = inject(DivisionService);
  private clubService = inject(ClubService);

  clubes: any[] = [];
  divisions: any[] = [];
  cargando: boolean = false;
  error: string = '';

  ngOnInit(): void {
    this.cargarClubes();
  }

  cargarClubes() {
    this.clubService.getClubes().subscribe({
      next: (data) => this.clubes = data,
      error: (err) => console.error('Error al cargar clubes', err)
    });
  }

  onClubChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const clubId = selectElement.value;
    if (clubId) {
      this.obtenerDivisiones(clubId);
    }
  }

  obtenerDivisiones(clubId: string) {
    this.cargando = true;
    this.error = '';
    this.divisionService.getDivisiones(clubId).subscribe({
      next: (data) => {
        this.divisions = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar las divisiones', err);
        this.error = 'No se pudieron cargar las divisiones.';
        this.cargando = false;
      }
    });
  }
}