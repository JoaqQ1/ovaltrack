import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ClubListComponent } from './features/club/club-list.component';
import { ClubDetailsComponent } from './features/club/club-details.component';
import { DivisionDetailsComponent } from './features/division/division-details.component';
import { DivisionListComponent } from './features/division/division-list.component';
import { DivisionPlayerDetailsComponent } from './features/division-player/division-player-details.component';
import { hasRoleGuard } from './core/guards/has-role.guard';

export const routes: Routes = [
    // Raíz: redirige a /home
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },

    {
        path: 'home',
        loadComponent: () =>
            import('./features/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'carga-en-vivo',
        canActivate:[hasRoleGuard],
        
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB", "COACH_ANALYST"]
        },
        loadComponent: () =>
            import('./features/cargaEnVivo/carga-en-vivo/carga-en-vivo.component').then(
                m => m.CargaEnVivoComponent
            )
    },
    {
        canMatch: [authGuard],
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        path: 'club',
        component: ClubListComponent
    },
    {
        path: 'club/new',
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        component: ClubDetailsComponent
    },
    {
        path: 'divisions/new',
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        canMatch: [authGuard],
        component: DivisionDetailsComponent
    },
    {
        path: 'divisions',
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        canMatch: [authGuard],
        component: DivisionListComponent
    },
    {
        path: 'players/new',
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB", "COACH_ANALYST"]
        },
        canMatch: [authGuard],
        component: DivisionPlayerDetailsComponent
    },
    {
        path: 'members',
        canMatch: [authGuard],
        loadComponent: () =>
            import('./features/members/pages/members-list/members-list.component').then(
                m => m.MembersListComponent
            )
    },
    {
        path: 'miembros',
        redirectTo: 'members',
        pathMatch: 'full'
    },
    // Wildcard para rutas no encontradas
    {
        path: '**',
        redirectTo: 'home'
    }
];
