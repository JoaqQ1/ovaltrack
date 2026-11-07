/**
 * Los specs puros corren en Node y `environment.ts` lee `window`, que ahí no existe.
 * Se importa primero en los specs que traen servicios reales del núcleo (`UserContextService`, `LiveMatchSource`).
 */
Object.assign(globalThis, { window: {} });
