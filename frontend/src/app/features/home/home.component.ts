import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  goToCargaEnVivo(): void {
    void this.router.navigate(['/carga-en-vivo']);
  }

  goToDivisions(): void {
    void this.router.navigate(['/divisions']);
  }

  goToMembers(): void {
    void this.router.navigate(['/members']);
  }

  logout(): void {
    this.authService.logout();
  }
}