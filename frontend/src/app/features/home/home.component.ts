import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { UserContextService } from '../../core/services/user-context.service';
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly userContextService = inject(UserContextService);

  readonly currentUser = this.authService.currentUser;

  // Catálogo de secciones protegidas con control de roles
  private readonly allNavigationCards: NavigationCard[] = [
    {
      title: 'Seleccion de partidos',
      description: 'Tagging y registro en tiempo real de eventos de partido y métricas tácticas.',
      route: '/match-selection',
      badge: 'En vivo',
      allowedRoles: ['ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'live'
    },
    {
      title: 'Divisiones & Planteles',
      description: 'Consulta de categorías, listados de equipos y gestión de convocatorias.',
      route: '/divisions',
      badge: 'Gestión',
      allowedRoles: ['ADMIN_CLUB', 'COACH_ANALYST', 'PLAYER', 'ADMIN_OVALTRACK'] as UserRole[],
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
      title: 'Gestión de Miembros',
      description: 'Administración de usuarios, roles deportivos y asignación de permisos.',
      route: '/members',
      badge: 'Admin',
      allowedRoles: ['ADMIN_CLUB', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'members'
    },
    {
      title: 'Nuevo Jugador',
      description: 'Alta y asignación de perfiles médicos y técnicos al plantel.',
      route: '/players/new',
      badge: 'Staff',
      allowedRoles: ['ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK'] as UserRole[],
      icon: 'player'
    }
  ];

  readonly isPlayer = computed(() => this.currentUser()?.role === 'PLAYER');

  readonly visibleCards = computed(() => {
    const user = this.currentUser();
    if (!user || user.role === 'PLAYER') return [];
    return this.allNavigationCards.filter(card => card.allowedRoles.includes(user.role));
  });

  goToMembers(): void {
    void this.router.navigate(['/members']);
  }

  logout(): void {
    this.authService.logout();
  }

  goToMatchSelection(): void {
    void this.router.navigate(['/match-selection']);
  }
}