import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-list.component.html'
})
export class ClubListComponent implements OnInit {
  private clubService = inject(ClubService);
  
  clubes: any[] = [];
  cargando: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.obtenerClubes();
  }

  obtenerClubes() {
    this.clubService.getClubes().subscribe({
      next: (data) => {
        this.clubes = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar los clubes', err);
        this.error = 'No se pudieron cargar los clubes. Intenta nuevamente.';
        this.cargando = false;
      }
    });
  }
}