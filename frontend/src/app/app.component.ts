import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment.docker';
import { HttpClient } from '@angular/common/http';

interface PingResponse {
  status: string;
  message: string;
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent {
  private http = inject(HttpClient);

  isConnected = false;
  statusMessage = 'Intentando conectar con el backend...';

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
