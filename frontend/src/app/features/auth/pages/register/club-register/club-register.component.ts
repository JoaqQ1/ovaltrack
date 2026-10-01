import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegistroRequest } from '../../../types/auth.types';

@Component({
  selector: 'app-club-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './club-register.component.html',
  styleUrl: './club-register.component.css'
})
export class ClubRegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  // private router = inject(Router);
  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    birthDate: ['', [Validators.required]],
    clubName: ['', [Validators.required]],
    clubRegion: ['', [Validators.required]],
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

    // Estructura de la petición mapeando al rol ADMIN_CLUB requerido para alta de club (HU-5.12)
    const payload: RegistroRequest = {
      firstName: rawData.firstName,
      lastName: rawData.lastName,
      email: rawData.email,
      password: rawData.password,
      birthDate: rawData.birthDate,
      role: 'ADMIN_CLUB',
      clubName: rawData.clubName,
      clubRegion: rawData.clubRegion
    };

    this.authService.register(payload).subscribe({
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
