import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { SelectivePreloadingStrategy } from './core/routing/selective-preloading.strategy';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptor/jwt.interceptor'; 
import { initializeLocalDatabases } from './features/local-database/local-databases';
import { DexieLiveMatchSource, LiveMatchSource } from './core/navigation/live-match.source';
import { MockSyncStatusSource, SyncStatusSource } from './core/navigation/sync-status.source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => initializeLocalDatabases(),
      multi: true,
    },
    provideHttpClient(withInterceptors([jwtInterceptor])),
    { provide: LiveMatchSource, useClass: DexieLiveMatchSource },
    // Mockup: reemplazar por la implementación real cuando se conecte la sincronización a la barra.
    { provide: SyncStatusSource, useClass: MockSyncStatusSource }
  ]
};