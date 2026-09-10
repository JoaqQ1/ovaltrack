import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClubService } from 'src/app/services/club.service';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './club-form.component.html',
  styleUrls: ['./club-form.component.scss']
})
export class ClubFormComponent implements OnInit {
  private clubService = inject(ClubService);
  private router = inject(Router);

  // Definimos adminUserId de forma plana para que coincida con el DTO
  club = {
    name: '',
    city: '',
    adminUserId: ''
  };

  usuarios: any[] = [];
  mensajeError = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.clubService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => {
        console.error('Error al cargar los usuarios', err);
      }
    });
  }

  guardarClub() {
    this.clubService.createClub(this.club).subscribe({
      next: () => {
        this.router.navigate(['/clubes']);
      },
      error: (err) => {
        console.error('Error al guardar el club', err);
        this.mensajeError = err.error || 'No se pudo guardar el club.';
      }
    });
  }
}