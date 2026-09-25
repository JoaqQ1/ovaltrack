import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '@environments/environment.docker';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

interface PingResponse {
  status: string;
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  isConnected = false;
  statusMessage = 'Intentando conectar con el backend...';
  currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }

  get showNavbar(): boolean {
    const url = this.currentUrl();
    return !url.includes('/live-capture');
  }

  ngOnInit(): void {
    this.http.get<PingResponse>(`${environment.apiUrl}/api`).subscribe({
      next: (data) => {
        this.isConnected = true;
        this.statusMessage = `${data.message} (status: ${data.status})`;
      },
      error: (err) => {
        this.isConnected = false;
        this.statusMessage = `Error al conectar con ${environment.apiUrl}: ${err.message}`;
      }
    });
  }
}
