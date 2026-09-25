import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../types/auth.types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.nonNullable.group({
    accountType: ['NO_ROLE' as UserRole, [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    birthDate: ['', [Validators.required]],
  });

  errorMessage = '';
  isSubmitting = false;

  constructor() {
    this.registerForm.controls.accountType.valueChanges.subscribe((role) => {
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { accountType,  ...baseData } = this.registerForm.getRawValue();

    const data = {
      ...baseData,
      role: accountType,
    };

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.register(data).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.errorMessage = this.authService.getErrorMessage(error, 'register');
        this.isSubmitting = false;
      }
    });
  }
}