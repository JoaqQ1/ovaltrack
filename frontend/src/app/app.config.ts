import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // 👈 Importar withInterceptors
import { jwtInterceptor } from './core/interceptor/jwt.interceptor';          // 👈 Importar jwtInterceptor
import { initializeLocalDatabases } from './features/cargaEnVivo/data/local-databases';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => initializeLocalDatabases(),
      multi: true,
    },
    provideHttpClient(withInterceptors([jwtInterceptor])) // 👈 Registrar el interceptor aquí
  ]
};