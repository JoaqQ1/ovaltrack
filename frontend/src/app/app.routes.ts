import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ClubListComponent } from './features/club/club-list.component';
import { ClubDetailsComponent } from './features/club/club-details.component';
import { DivisionDetailsComponent } from './features/division/division-details.component';
import { DivisionListComponent } from './features/division/division-list.component';
import { DivisionPlayerDetailsComponent } from './features/division-player/division-player-details.component';

export const routes: Routes = [
    {
        path: 'home',
        canMatch: [authGuard],
        loadComponent: () =>
            import('./features/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'carga-en-vivo',
        loadComponent: () =>
            import('./features/cargaEnVivo/carga-en-vivo/carga-en-vivo.component').then(
                m => m.CargaEnVivoComponent
            )
    },
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full'
    },
    { 
        path: 'club', 
        component: ClubListComponent 
    },
    {   
        path: 'club/new', 
        component: ClubDetailsComponent 
    },
    {   
        path: 'divisions/new', 
        component: DivisionDetailsComponent 
    },
    {   
        path: 'divisions', 
        component: DivisionListComponent 
    },
    {   
        path: 'players/new', 
        component: DivisionPlayerDetailsComponent
    },
];
