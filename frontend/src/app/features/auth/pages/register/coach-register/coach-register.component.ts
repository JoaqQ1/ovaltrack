import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegistroRequest } from '../../../types/auth.types';
import { ClubService } from '../../../../../services/club.service';
import { ClubRegistrationOption } from '../../../../club/types/club.types';

@Component({
  selector: 'app-coach-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './coach-register.component.html',
  styleUrl: './coach-register.component.css'
})
export class CoachRegisterComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly clubService = inject(ClubService);

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    birthDate: ['', [Validators.required]],
    clubId: ['', [Validators.required]],
    termsAccepted: [false, [Validators.requiredTrue]]
  });

  clubs: ClubRegistrationOption[] = [];
  clubQuery = '';
  isClubDropdownOpen = false;
  activeClubIndex = -1;
  isLoadingClubs = true;
  clubsError = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  get filteredClubs(): ClubRegistrationOption[] {
    const query = this.clubQuery.trim().toLocaleLowerCase();
    if (!query) {
      return this.clubs;
    }

    return this.clubs.filter((club) =>
      `${club.name} ${club.city || ''}`.toLocaleLowerCase().includes(query)
    );
  }

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.isLoadingClubs = true;
    this.clubsError = '';

    this.clubService.getRegistrationOptions().subscribe({
      next: (clubs) => {
        this.clubs = clubs;
        this.isLoadingClubs = false;
        if (clubs.length === 0) {
          this.clubsError = 'Todavía no hay clubes activos disponibles para solicitar acceso.';
        }
      },
      error: () => {
        this.clubsError = 'No se pudieron cargar los clubes. Inténtalo nuevamente.';
        this.isLoadingClubs = false;
      }
    });
  }

  onClubSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clubQuery = input.value;
    this.registerForm.controls.clubId.setValue('');
    this.isClubDropdownOpen = true;
    this.activeClubIndex = -1;
  }

  openClubDropdown(): void {
    this.isClubDropdownOpen = true;
    this.activeClubIndex = -1;
  }

  closeClubDropdown(): void {
    this.isClubDropdownOpen = false;
    this.activeClubIndex = -1;
  }

  onClubSearchKeydown(event: KeyboardEvent): void {
    const options = this.filteredClubs;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isClubDropdownOpen = true;
      if (options.length > 0) {
        this.activeClubIndex = this.activeClubIndex < 0
          ? 0
          : (this.activeClubIndex + 1) % options.length;
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.isClubDropdownOpen = true;
      if (options.length > 0) {
        this.activeClubIndex = this.activeClubIndex < 0 || this.activeClubIndex === 0
          ? options.length - 1
          : this.activeClubIndex - 1;
      }
      return;
    }

    if (event.key === 'Enter' && this.isClubDropdownOpen && options.length > 0) {
      event.preventDefault();
      const selectedIndex = this.activeClubIndex >= 0 ? this.activeClubIndex : 0;
      this.selectClub(options[selectedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      this.closeClubDropdown();
    }
  }

  selectClub(club: ClubRegistrationOption): void {
    this.registerForm.controls.clubId.setValue(club.id);
    this.registerForm.controls.clubId.markAsTouched();
    this.clubQuery = club.name;
    this.closeClubDropdown();
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    const formData = this.registerForm.getRawValue();
    const payload: RegistroRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      birthDate: formData.birthDate,
      role: 'COACH_ANALYST',
      clubId: formData.clubId
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = this.authService.getErrorMessage(error, 'register');
        this.isSubmitting = false;
      }
    });
  }
}
