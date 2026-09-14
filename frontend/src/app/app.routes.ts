import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'home',
        canMatch: [authGuard],
        loadComponent: () =>
            import('./features/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'carga-en-vivo/:matchId',
        loadComponent: () =>
            import('./features/cargaEnVivo/carga-en-vivo/carga-en-vivo.component').then(
                m => m.CargaEnVivoComponent
            )
    },
    {
        path: 'carga-en-vivo',
        redirectTo: 'carga-en-vivo/550e8400-e29b-41d4-a716-446655440002',
        pathMatch: 'full'
    },
    {
        path: 'match-selection',
        loadComponent: () =>
            import('./features/cargaEnVivo/match-selection/match-selection.component').then(
                m => m.MatchSelectComponent
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
    }
];
