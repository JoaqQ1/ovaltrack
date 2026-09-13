import { Component, computed, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { CurrentUserSession, UserRole } from '../auth/types/auth.types';
import { NavigationCard } from './types/home.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  currentUser: CurrentUserSession | null = null;
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser();
    console.log(this.currentUser);
  }
  // Catálogo de secciones protegidas con control de roles
  private readonly allNavigationCards: NavigationCard[] = [
    {
      title: 'Carga en Vivo',
      description: 'Tagging y registro en tiempo real de eventos de partido y métricas tácticas.',
      route: '/carga-en-vivo',
      badge: 'En vivo',
      allowedRoles: ['ADMIN_CLUB', 'COACH', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'live'
    },
    {
      title: 'Divisiones & Planteles',
      description: 'Consulta de categorías, listados de equipos y gestión de convocatorias.',
      route: '/divisions',
      badge: 'Gestión',
      allowedRoles: ['ADMIN', 'COACH', 'PLAYER', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'division'
    },
    {
      title: 'Gestión del Club',
      description: 'Administración de sede, configuraciones globales y estructura institucional.',
      route: '/club',
      badge: 'Admin',
      allowedRoles: ['ADMIN_CLUB', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'club'
    },
    {
      title: 'Nuevo Jugador',
      description: 'Alta y asignación de perfiles médicos y técnicos al plantel.',
      route: '/players/new',
      badge: 'Staff',
      allowedRoles: ['ADMIN_CLUB', 'COACH', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'player'
    }
  ];
  readonly visibleCards = computed(() => {
    if (this.currentUser === null) return;
    const role = this.currentUser?.role;
    return this.allNavigationCards.filter(card => card.allowedRoles.includes(role));
  });

  goToMembers(): void {
    void this.router.navigate(['/members']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
  
}