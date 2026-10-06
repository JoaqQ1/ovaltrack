import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegistrationRequest } from '../types/register.type';
import { ClubRegistrationDTO } from '../../../types/auth.types';

@Component({
  selector: 'app-club-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './club-register.component.html',
  styleUrl: './club-register.component.css'
})
export class ClubRegisterComponent {

  private fb = inject(FormBuilder);
  constructor(private authService: AuthService) { }

  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    birthDate: ['', [Validators.required]],
    clubName: ['', [Validators.required]],
    clubRegion: ['', [Validators.required]],
    clubContactPhone: [''],
    termsAccepted: [false, [Validators.requiredTrue]]
  });

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const rawData = this.registerForm.getRawValue();

    const payload: ClubRegistrationDTO = {
      admin: {
        email: rawData.email,
        password: rawData.password,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        birthDate: rawData.birthDate
      },
      club: {
        name: rawData.clubName,
        city: rawData.clubRegion,
        contactEmail: rawData.email,
        contactPhone: rawData.clubContactPhone || undefined
      }
    };
 
    this.authService.registerClub(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.errorMessage = this.authService.getErrorMessage(error, 'register');
        this.isSubmitting = false;
      }
    });
  }

}
