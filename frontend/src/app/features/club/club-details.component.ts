import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from 'src/app/services/club.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Club, ClubUpdateRequest } from './types/club.types';

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
  
  club: Club | null = null;
  clubDraft: ClubUpdateRequest | null = null;
  isEditing: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit(): void {
    this.loadMyClub();
  }

  loadMyClub(): void {
    this.clubService.getMyClub().subscribe({
      next: (data: Club) => {
        this.club = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar la información del club', err);
        this.errorMessage = 'No se pudo cargar la información de tu club.';
        this.isLoading = false;
      }
    });
  }

  getInitial(name?: string): string {
    if (!name?.trim()) return 'C';
    return name.trim().charAt(0).toUpperCase();
  }

  startEditing(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.club) {
      this.clubDraft = {
        name: this.club.name || '',
        city: this.club.city || '',
        logoUrl: this.club.logoUrl || '',
        contactEmail: this.club.contactEmail || '',
        contactPhone: this.club.contactPhone || ''
      };
    }
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.clubDraft = null;
    this.errorMessage = '';
    this.isEditing = false;
  }

  saveChanges(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.clubDraft || !this.club) return;

    const trimmedName = this.clubDraft.name?.trim();
    if (!trimmedName) {
      this.errorMessage = 'El nombre del club es obligatorio';
      return;
    }

    const trimmedCity = this.clubDraft.city?.trim();
    if (!trimmedCity) {
      this.errorMessage = 'La ciudad del club es obligatoria';
      return;
    }

    const email = this.clubDraft.contactEmail?.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.errorMessage = 'Formato de email de contacto inválido';
        return;
      }
    }
    
    this.isSaving = true;

    const updatePayload: ClubUpdateRequest = {
      name: trimmedName,
      city: trimmedCity,
      logoUrl: this.clubDraft.logoUrl?.trim() || undefined,
      contactEmail: email || undefined,
      contactPhone: this.clubDraft.contactPhone?.trim() || undefined
    };

    this.clubService.updateClub(this.club.id, updatePayload).subscribe({
      next: (data: Club) => {
        this.club = data;
        this.successMessage = 'Información actualizada correctamente';
        this.isSaving = false;
        this.isEditing = false;

        const currentCtx = this.userContextService.userContext();
        if (currentCtx) {
          this.userContextService.setContext({
            ...currentCtx,
            club: data
          });
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al actualizar club', err);
        if (err.status === 409 || err.status === 400) {
          this.errorMessage = err.error?.message || (typeof err.error === 'string' ? err.error : 'Conflicto al actualizar la información del club.');
        } else {
          this.errorMessage = 'Error al actualizar el club. Intenta nuevamente.';
        }
      }
    });
  }
}