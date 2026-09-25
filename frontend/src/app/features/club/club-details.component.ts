import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from 'src/app/services/club.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-club-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './club-details.component.html',
  styleUrls: ['./club-details.component.css']
})
export class ClubDetailsComponent implements OnInit {
  private readonly clubService = inject(ClubService);
  private readonly userContextService = inject(UserContextService);
  
  club: any = null;
  clubDraft: any = null;
  isEditing: boolean = false;
  cargando: boolean = true;
  guardando: boolean = false;
  error: string = '';
  exito: string = '';

  ngOnInit(): void {
    this.obtenerMiClub();
  }

  obtenerMiClub(): void {
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

  iniciarEdicion(): void {
    this.error = '';
    this.exito = '';
    this.clubDraft = { ...this.club };
    this.isEditing = true;
  }

  cancelarEdicion(): void {
    this.clubDraft = null;
    this.error = '';
    this.isEditing = false;
  }

  guardarCambios(): void {
    this.error = '';
    this.exito = '';

    if (!this.clubDraft?.name?.trim()) {
      this.error = 'El nombre del club es obligatorio';
      return;
    }
    
    this.guardando = true;

    this.clubService.updateClub(this.club.id, this.clubDraft).subscribe({
      next: (data) => {
        this.club = data;
        this.exito = 'Información actualizada correctamente';
        this.guardando = false;
        this.isEditing = false;
        this.userContextService.loadUserContext().subscribe();
      },
      error: (err) => {
        this.guardando = false;
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