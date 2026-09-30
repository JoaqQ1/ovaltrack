# Plan de Implementación Definitivo: Cierre del Primer Tiempo, Transición de Etapa y Estadísticas

> **Proyecto:** OvalTrack  
> **Feature:** Como entrenador/analista, quiero cerrar el primer tiempo del partido, para pasar a la siguiente etapa y disparar el cálculo de estadísticas.  
> **Criterios de Aceptación:**  
> 1. El analista puede marcar el cierre del primer tiempo desde la pantalla de carga en vivo.  
> 2. Al cerrar el primer tiempo se conserva el registro de todos los eventos cargados hasta ese momento.  
> 3. Después del cierre, el sistema queda listo para continuar cargando el segundo tiempo.  

---

## 1. Decisiones de Diseño y Arquitectura Acordadas

1. **Métricas de Entretiempo (Alineadas con el Documento de Visión 6.5 y 6.7):**
   * **Marcador Parcial del 1T:** Tanteador propio y rival, desglose de jugadas de anotación (Tries, Conversiones, Penales a los palos, Drops).
   * **Posesión Neta:** % de tiempo y eventos con posesión `OWN` vs. `OPPONENT` (y `NEUTRAL`).
   * **Defensa:** Volumen total de tackles, tackles completados vs. tackles fallados y porcentaje de efectividad de tackle.
   * **Disciplina:** Conteo de penales/infracciones concedidas y tarjetas disciplinarias (`Amonestación` / `Expulsión`).
   * **Obtención y Contacto:** Turnovers ganados vs. perdidos, conteo de formaciones fijas disputadas (Scrums y Lineouts).
   * *Excluidas del entretiempo:* Mapas de calor, zonificación y tablas individuales densas por jugador (quedan reservadas para el análisis diferido post-partido).

2. **Cálculo de Estadísticas Híbrido y Resiliente (Local-First + Opción B en Backend):**
   * **Frontend (Offline-First):** Calcula el resumen inmediatamente desde IndexedDB (`liveCaptureDatabase.events`) para mostrar el modal de entretiempo sin depender de conexión a internet.
   * **Backend:** `StatisticService` calcula el DTO equivalente bajo demanda a partir de la tabla `events` (sin tablas intermedias prematuras, facilitando una migración futura a persistencia física sin alterar contratos de API).

3. **Ciclo de Estados del Partido (`MatchStatus` y `currentPeriod`):**
   * Incorporación del estado `HALFTIME` a `MatchStatus`.
   * Atributo `currentPeriod` (1 o 2) en la entidad `Match`.
   * **Flujo:** `IN_PROGRESS (period 1)` $\rightarrow$ Cierre de 1T $\rightarrow$ `HALFTIME` (reloj pausado, modal de estadísticas visible) $\rightarrow$ Iniciar 2T $\rightarrow$ `IN_PROGRESS (period 2)`.
   * Endpoint dedicado: `PUT /matches/{matchId}/start-second-half`.

4. **Comportamiento del Cronómetro en Pantalla:**
   * Al cerrar el 1T, el reloj se detiene automáticamente.
   * Al reanudar en el 2T, el reloj continúa de forma acumulada desde el minuto 40 (`40:00` hasta `80:00`).
   * Modal de confirmación deportivo para prevenir cierres accidentales.

5. **Desacoplamiento con Eventos de Dominio (SOLID):**
   * `MatchService` publica `MatchPeriodClosedEvent` mediante `ApplicationEventPublisher`.
   * `StatisticEventListener` escucha el evento y delega en `StatisticService`.
   * Preparado para escalar en el futuro hacia un `NotificationService` con cero modificaciones en `MatchService` (Principio Abierto/Cerrado).

---

## 2. Matriz de Escenarios (Happy Paths & Sad Paths)

### Happy Paths (Caminos Exitosos)

* **HP-01: Cierre exitoso del 1er tiempo en Backend (BDD)**  
  * **Dado**: Un partido en progreso (`IN_PROGRESS`), en el período 1 (`currentPeriod = 1`), con eventos registrados.
  * **Cuando**: El analista autenticado solicita cerrar el primer tiempo (`PUT /matches/{matchId}/close-first-half`).
  * **Entonces**:
    * El partido pasa a estado `HALFTIME`.
    * Todos los eventos registrados conservan su `period = 1`.
    * Se dispara el evento de dominio `MatchPeriodClosedEvent`.
    * La respuesta `200 OK` devuelve el DTO del partido actualizado.

* **HP-02: Inicio del segundo tiempo (BDD)**  
  * **Dado**: Un partido en `HALFTIME`.
  * **Cuando**: El analista envía `PUT /matches/{matchId}/start-second-half`.
  * **Entonces**:
    * El partido pasa a `IN_PROGRESS` con `currentPeriod = 2`.
    * Los nuevos eventos creados reciben `period = 2`.
    * Los eventos del primer tiempo permanecen inalterados.

* **HP-03: Cierre y visualización en Frontend (Offline-First)**  
  * **Dado**: La pantalla de carga en vivo con el reloj corriendo y eventos en curso.
  * **Cuando**: El analista presiona *"Cerrar 1° Tiempo"* y confirma el diálogo.
  * **Entonces**:
    * El reloj se pausa de inmediato.
    * Se despliega el modal deportivo de Entretiempo con las métricas calculadas localmente.
    * Los eventos previos siguen visibles en el historial y en el tanteador.
    * Al presionar *"Iniciar 2° Tiempo"*, el cronómetro avanza desde `40:00` y el catálogo asigna `period = 2`.

---

### Sad Paths & Casos Borde (Validaciones y Errores)

* **SP-01: Partido en estado inválido (`409 Conflict`)**  
  * Intentar cerrar el 1T cuando el partido está en `NOT_STARTED`, `FINISHED` o `CANCELLED`.
  * *Respuesta:* `409 Conflict` con mensaje `"El partido no se encuentra en curso en el primer tiempo"`.

* **SP-02: Doble cierre del primer tiempo (`409 Conflict`)**  
  * Intentar cerrar el 1T cuando el partido ya está en `HALFTIME` o en el segundo tiempo (`currentPeriod = 2`).
  * *Respuesta:* `409 Conflict` con mensaje `"El primer tiempo ya ha sido cerrado"`.

* **SP-03: Usuario sin rol o división autorizada (`403 Forbidden`)**  
  * Un jugador (`PLAYER`) o un entrenador de otra división/club intenta cerrar el tiempo.
  * *Respuesta:* `403 Forbidden` con mensaje `"Acceso denegado: no tiene permisos para gestionar este partido"`.

* **SP-04: Partido no encontrado (`404 Not Found`)**  
  * Envío de petición con UUID de partido inexistente.
  * *Respuesta:* `404 Not Found` con mensaje `"Partido no encontrado"`.

* **SP-05: Cancelación de modal en Frontend**  
  * El usuario presiona *"Cancelar"* en el diálogo de confirmación: el cronómetro sigue corriendo y el partido permanece en `IN_PROGRESS` sin alteración.

---

## 3. Plan de Trabajo por Componentes

```
┌─────────────────────────────────────────┐
│ 1. Testing BDD (Cucumber.js)            │
│    - Feature & Steps en Español         │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 2. Backend (Spring Boot 3.3.4, Java 21) │
│    - Match, Status, Eventos & Stats     │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 3. Frontend (Angular 18 PWA)            │
│    - Modal Deportivo, Reloj & Dexie     │
└─────────────────────────────────────────┘
```

### Componente 1: Testing BDD (`testing/`)
1. **`testing/features/match/01_cierre_primer_tiempo.feature`**:
   - Escenarios en español para HP-01, HP-02, SP-01, SP-02 y SP-03.
2. **`testing/features/match/step_definitions/match_period_steps.js`**:
   - Step definitions: login de entrenador, setup de partido de prueba, inyección de eventos en 1T, llamadas HTTP y verificaciones de contrato.

### Componente 2: Backend (`backend/`)
1. **`MatchStatus.java` y `Match.java`**:
   - Agregar valor `HALFTIME` y atributo `private Integer currentPeriod = 1;`.
2. **`MatchResponseDTO.java` y `MatchDTOMapper.java`**:
   - Mapear `currentPeriod`.
3. **`MatchPeriodClosedEvent.java`**:
   - Record inmutable: `(UUID matchId, Integer periodClosed, LocalDateTime closedAt)`.
4. **`MatchService.java`**:
   - Métodos `@Transactional closeFirstHalf(UUID matchId, Authentication auth)` y `startSecondHalf(UUID matchId, Authentication auth)`.
   - Publicación de `MatchPeriodClosedEvent`.
5. **`MatchSecurityValidator.java`**:
   - Validación de permisos para `COACH_ANALYST` y `ADMIN_CLUB`.
6. **`StatisticService.java` y `PeriodStatisticDTO.java`**:
   - Lógica de cálculo en memoria de métricas del 1T (marcador, posesión, tackles, penales, turnovers).
7. **`StatisticEventListener.java`**:
   - Listener `@EventListener` que consume `MatchPeriodClosedEvent`.
8. **`MatchController.java` y `StatisticController.java`**:
   - Endpoints `PUT /matches/{id}/close-first-half`, `PUT /matches/{id}/start-second-half` y `GET /statistics/match/{id}?period=1`.

### Componente 3: Frontend (`frontend/`)
1. **`live-capture.types.ts` y `match.types.ts`**:
   - Soporte para estado `halftime`, `currentPeriod` y el DTO `PeriodStatisticDTO`.
2. **`match.service.ts` y `live-capture.service.ts`**:
   - Métodos `closeFirstHalf(matchId)` y `startSecondHalf(matchId)`.
   - Cálculo local de estadísticas desde IndexedDB para visualización offline inmediata.
3. **`carga-en-vivo.component.ts`**:
   - Corrección en `commitEvent` para guardar `period: this.period`.
   - Manejo de confirmación, pausa automática del reloj y reanudación acumulada en `40:00`.
4. **`carga-en-vivo.component.html` y `.css`**:
   - Integración del modal deportivo de entretiempo (*Sport Pro Salvia*).

---

## 4. Plan de Verificación

* **Automatizada:**
  * `./ds test`: Comprobar que los nuevos escenarios de cierre de primer tiempo y los 38 escenarios existentes pasen al 100%.
  * `./ds compile`: Verificar compilación de Spring Boot sin errores.
* **Manual:**
  * Cargar eventos en el 1T en `http://localhost:4200/live-capture/{id}`.
  * Cerrar 1T en modo online y offline (simulado en DevTools), verificando que el modal aparezca de inmediato con las estadísticas correctas.
  * Iniciar 2T y verificar que el cronómetro continúe desde `40:00` y los nuevos eventos se asocien a `period = 2`.
