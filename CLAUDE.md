# CLAUDE.md

## Environment & Execution Rules

- **Docker-first Monorepo**: Three services: `backend/` (Spring Boot), `frontend/` (Angular 18 PWA), `testing/` (Cucumber.js).
- **Single Entrypoint**: `./ds` is the sole script for running, building, testing, and managing the project.
- **Do NOT run `mvn`/`npm`/`ng` on the host**: Everything runs in Docker containers (only `./backend/mvnw` works directly if needed).

## Essential Commands

- `./ds up` — Starts backend, frontend, and PostgreSQL in detached mode (auto-creates `.env` on first run).
- `./ds down` — Stops containers (preserves database volumes).
- `./ds ps` — Lists running containers and health status.
- `./ds logs [svc]` — Streams logs for all services or a specific service (e.g. `./ds logs backend`).
- `./ds compile` — Recompiles Java code in the backend container (`dc exec backend mvn compile -DskipTests`).
- `./ds test` — Runs the Cucumber.js BDD test suite against the running backend.
- `./ds staging data.sql` — Seeds/resets the PostgreSQL database with the script from `staging/`.
- `./ds db` — Opens an interactive PostgreSQL session (`psql`).
- `./ds sync-node` — Copies `node_modules` from container to host for local IDE autocompletion.
- `./ds install` — Runs `npm install --legacy-peer-deps` inside the frontend container.
- `./ds reset` — Resets containers and wipes database volumes (prompts for confirmation).

## Backend Architecture

- **Stack**: Spring Boot **3.3.4**, **Java 21**, Lombok, Spring Security (JWT + DevMockAuth), SpringDoc OpenAPI (`/swagger-ui`), Actuator (`/actuator/health`).
- **Hot Reload**: `backend/run.sh` monitors `src/` with `inotifywait` and triggers Spring DevTools restart.
- **Database**: PostgreSQL with Hibernate `ddl-auto=update` (schema synced automatically from JPA entities, no manual migrations).
- **API Standards**:
  - Direct REST payloads (return domain DTOs directly, no artificial generic `ApiResponse` envelopes).
  - Use standard HTTP status codes (`200 OK`, `201 Created`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).
  - Strict separation: Entity $\leftrightarrow$ DTO Mapper $\leftrightarrow$ Service $\leftrightarrow$ Controller/Presenter.

## Frontend Architecture

- **Stack**: Angular 18 PWA, Standalone Components, `inject()`-based Dependency Injection.
- **HTTP & Auth**: `provideHttpClient(withInterceptors([jwtInterceptor]))` ensures JWT Bearer tokens are attached automatically.
- **State & Reactivity**: Prefer RxJS reactive pipelines (`switchMap`, `takeUntilDestroyed`) or Angular Signals over nested `.subscribe()` calls.
- **Typing**: Strong domain typing with TypeScript interfaces in `features/<domain>/types/`. Avoid `any`.

## Testing Conventions

- **BDD Suite**: Cucumber.js under `testing/`.
- Feature files (`.feature`) and step definitions are written in **Spanish**.
- Targets the live backend at `http://backend:8080`.
- Run tests with `./ds test`.

## Development Guidelines (SOLID & Clean Code)

- **S (Single Responsibility)**: Separate Entities, DTOs, Mappers, Business Services, and Presenters/Controllers.
- **O (Open/Closed)**: DTOs decouple persistence schemas from API contracts.
- **L (Liskov Substitution)**: Subtypes and interfaces must fulfill expected contracts.
- **I (Interface Segregation)**: Small, specific DTOs and interfaces.
- **D (Dependency Inversion)**: Rely on abstractions and Spring / Angular Dependency Injection.
