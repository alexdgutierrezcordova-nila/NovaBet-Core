import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

/**
 * Configuración global de la aplicación Angular (NovaBet Web).
 * 
 * ARQUITECTURA:
 * - provideHttpClient(withFetch()): Habilita la inyección de HttpClient utilizando
 *   la Fetch API moderna, optimizando el rendimiento tanto en cliente como en Server-Side Rendering (SSR).
 * - provideClientHydration(): Hidratación progresiva para SSR.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch())
  ]
};
