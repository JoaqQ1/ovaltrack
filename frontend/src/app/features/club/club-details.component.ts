import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from 'src/app/services/club.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Club, ClubUpdateRequest } from './types/club.types';
import { ToastService } from 'src/app/core/services/toast.service';

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
  private readonly toastService = inject(ToastService);
  
  club: Club | null = null;
  clubDraft: ClubUpdateRequest | null = null;
  isEditing: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;

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
        this.toastService.show('error', 'No se pudo cargar la información de tu club.', 'Error de carga');
        this.isLoading = false;
      }
    });
  }

  getInitial(name?: string): string {
    if (!name?.trim()) return 'C';
    return name.trim().charAt(0).toUpperCase();
  }

  startEditing(): void {
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
    this.isEditing = false;
  }

  saveChanges(): void {
    if (!this.clubDraft || !this.club) return;

    const trimmedName = this.clubDraft.name?.trim();
    if (!trimmedName) {
      this.toastService.show('warning', 'El nombre del club es obligatorio', 'Campo requerido');
      return;
    }

    const trimmedCity = this.clubDraft.city?.trim();
    if (!trimmedCity) {
      this.toastService.show('warning', 'La ciudad del club es obligatoria', 'Campo requerido');
      return;
    }

    const email = this.clubDraft.contactEmail?.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.toastService.show('warning', 'Formato de email de contacto inválido', 'Email inválido');
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
        this.toastService.show('success', 'Información actualizada correctamente', 'Guardado exitoso');
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
        let errorMsg = 'Error al actualizar el club. Intenta nuevamente.';
        if (err.status === 409 || err.status === 400) {
          errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Conflicto al actualizar la información del club.');
        }
        this.toastService.show('error', errorMsg, 'Error');
      }
    });
  }
}