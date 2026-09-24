import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ClubDetailsComponent } from './features/club/club-details.component';
import { ClubCreateComponent } from './features/club/club-create.component';
import { DivisionFormComponent } from './features/division/division-form.component';
import { DivisionListComponent } from './features/division/division-list.component';
import { DivisionPlayerFormComponent } from './features/division-player/division-player-form.component';
import { DivisionCoachListComponent } from './features/division-coach/division-coach-list.component';
import { hasRoleGuard } from './core/guards/has-role.guard';
import { SelectionRosterComponent } from './features/match/selection-roster/selection-roster.component';
import { hasClubGuard } from './core/guards/has-club.guard';

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
        path: 'live-capture/:matchId',
        canMatch: [authGuard],
        canActivate: [hasRoleGuard, hasClubGuard],
        data: {
            roles: ['ADMIN_OVALTRACK', 'ADMIN_CLUB', 'COACH_ANALYST']
        },
        loadComponent: () =>
            import('./features/match/live-capture/live-capture.component').then(
                m => m.CargaEnVivoComponent
            )
    },
    {
        path: 'match-selection',
        canMatch: [authGuard],
        canActivate: [hasRoleGuard],
        data: {
            roles: ['ADMIN_OVALTRACK', 'ADMIN_CLUB', 'COACH_ANALYST']
        },
        loadComponent: () =>
            import('./features/match/match-selection/match-selection.component').then(
                m => m.MatchSelectComponent
            )
    },
    {
        canMatch: [authGuard],
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        path: 'club',
        component: ClubDetailsComponent
    },
    {
        path: 'club/new',
        canActivate:[hasRoleGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        component: ClubCreateComponent
    },
    {
        path: 'divisions/new',
        canActivate:[hasRoleGuard, hasClubGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
        canMatch: [authGuard],
        component: DivisionFormComponent
    },
    {
        path: 'divisions',
        canActivate:[hasRoleGuard, hasClubGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB", "COACH_ANALYST"]
        },
        canMatch: [authGuard],
        component: DivisionListComponent
    },
    {
        path: 'divisions/:divisionId/coaches',
        canActivate: [hasRoleGuard, hasClubGuard],
        data: {
            roles: ['ADMIN_OVALTRACK', 'ADMIN_CLUB', 'COACH_ANALYST']
        },
        canMatch: [authGuard],
        component: DivisionCoachListComponent
    },
    {
        path: 'players/new',
        canActivate:[hasRoleGuard, hasClubGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB", "COACH_ANALYST"]
        },
        canMatch: [authGuard],
        component: DivisionPlayerFormComponent
    },
    {
        path: 'members',
        canMatch: [authGuard],
        canActivate: [hasRoleGuard, hasClubGuard],
        data: {
            roles: ["ADMIN_OVALTRACK", "ADMIN_CLUB"]
        },
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
    {
        path: 'selection-roster/:id',
        component: SelectionRosterComponent
    },
    // Wildcard para rutas no encontradas
    {
        path: '**',
        redirectTo: 'home'
    }
];
