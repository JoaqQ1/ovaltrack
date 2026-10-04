import { Routes } from '@angular/router';


export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register-selector/register-selector.component').then(m => m.RegisterSelectorComponent)
  },
  {
    path: 'register/club',
    loadComponent: () =>
      import('./pages/register/club-register/club-register.component').then(m => m.ClubRegisterComponent)
  },
  {
    path: 'register/coach',
    loadComponent: () =>
      import('./pages/register/coach-register/coach-register.component').then(m => m.CoachRegisterComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];