import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Contenedor de las vistas de análisis post-partido (Eventos, Zonas y Estadísticas). */
@Component({
  selector: 'app-post-match-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; }']
})
export class PostMatchShellComponent {}
