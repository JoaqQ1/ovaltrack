import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ClubListComponent } from './features/club-list/club-list.component';
import { ClubFormComponent } from './features/club-form/club-form.component';

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
        path: 'clubes', 
        component: ClubListComponent 
    },
    {   
        path: 'clubes/nuevo', 
        component: ClubFormComponent 
    },
];
