import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavbarPublicComponent } from 'src/app/shared/components/navbar-public/navbar-public.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarPublicComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  @ViewChild('myPassword') myInputRef!: ElementRef;
  @ViewChild('myBtnChangeVisibity') myBtnRef!: ElementRef;
  private isPasswordVisible: boolean = false;
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  errorMessage = '';

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (error) => {
        this.errorMessage = this.authService.getErrorMessage(error, 'login');
      }
    });
  }
  visiblePassword() {
    const type = (this.isPasswordVisible) ? 'password' : 'text';
    const color = (this.isPasswordVisible) ? '#ffffff' : '#a3e635';
    this.myInputRef.nativeElement.type = type;
    this.myBtnRef.nativeElement.style.color = color
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
