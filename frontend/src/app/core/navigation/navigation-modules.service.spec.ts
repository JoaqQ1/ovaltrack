import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../features/auth/services/auth.service';
import { UserRole } from '../../features/auth/types/auth.types';
import { NavigationModulesService } from './navigation-modules.service';

describe('NavigationModulesService', () => {
  const role = signal<UserRole | null>(null);

  function labels(): string[] {
    return TestBed.inject(NavigationModulesService).modules().map(module => module.label);
  }

  beforeEach(() => {
    role.set(null);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { effectiveRole: role } }],
    });
  });

  it('no muestra módulos sin usuario', () => {
    expect(labels()).toEqual([]);
  });

  it('administrador de club: Inicio, Partidos, Divisiones, Club, Miembros', () => {
    role.set('ADMIN_CLUB');
    expect(labels()).toEqual(['Inicio', 'Partidos', 'Divisiones', 'Club', 'Miembros']);
  });

  it('entrenador: oculta Reportes mientras no tenga ruta', () => {
    role.set('COACH_ANALYST');
    expect(labels()).toEqual(['Inicio', 'Partidos', 'Divisiones']);
  });

  it('jugador: oculta Partidos mientras no tenga ruta', () => {
    role.set('PLAYER');
    expect(labels()).toEqual(['Inicio', 'Estadísticas']);
  });

  it('administrador de OvalTrack: Inicio y Administración', () => {
    role.set('ADMIN_OVALTRACK');
    expect(labels()).toEqual(['Inicio', 'Administración']);
  });
});
