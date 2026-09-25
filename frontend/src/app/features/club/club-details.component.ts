import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-club-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './club-details.component.html',
  styleUrls: ['./club-details.component.css']
})
export class ClubDetailsComponent implements OnInit {
  private clubService = inject(ClubService);
  
  club: any = null;
  cargando: boolean = true;
  error: string = '';
  exito: string = '';

  ngOnInit(): void {
    this.obtenerMiClub();
  }

  obtenerMiClub() {
    this.clubService.getMyClub().subscribe({
      next: (data) => {
        this.club = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar la información del club', err);
        this.error = 'No se pudo cargar la información de tu club.';
        this.cargando = false;
      }
    });
  }

  getInitial(name: string): string {
    if (!name) return 'C';
    return name.charAt(0).toUpperCase();
  }

  guardarCambios() {
    this.error = '';
    this.exito = '';
    if (!this.club.name) {
      this.error = 'El nombre del club es obligatorio';
      return;
    }
    
    this.clubService.updateClub(this.club.id, this.club).subscribe({
      next: (data) => {
        this.exito = 'Información actualizada correctamente';
        this.club = data;
      },
      error: (err) => {
        console.error('Error al actualizar club', err);
        if (err.status === 409) {
           this.error = err.error || 'Conflicto al actualizar la información del club.';
        } else {
           this.error = 'Error al actualizar el club. Intenta nuevamente.';
        }
      }
    });
  }
}