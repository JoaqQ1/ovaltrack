# AGENTS.md

## Environment

- Three-service Docker monorepo: `backend/` (Spring Boot), `frontend/` (Angular 18 PWA), `testing/` (Cucumber.js). No local Java/Maven/Node/Angular toolchain — everything builds and runs in containers. Do NOT run `mvn`/`npm`/`ng` on the host (only `backend/mvnw` works directly); use `./ds`.
- `./ds` is the single entrypoint. First `./ds up` auto-creates `.env` from `.env.example`. `up` runs detached (`docker compose up -d --build`).

## Commands

- `./ds up` / `down` / `ps` / `logs [svc]` / `restart [svc]` / `build [svc]` / `db` (interactive psql).
- `./ds compile` — recompiles backend Java in-container (`dc exec backend mvn compile -DskipTests`).
- `./ds mvn <args>` — arbitrary Maven command in the backend container.
- `./ds test` — runs the `testing` service (it uses the `--profile test` compose profile); requires the backend to be up and healthy.
- `./ds staging data.sql` — seeds/resets the PostgreSQL database with the specified script from `staging/`.
- `./ds sync-node` — copies `node_modules` from container to host for local IDE autocompletion.
- `./ds install` — runs `npm install --legacy-peer-deps` inside the frontend container.
- **`./ds down` keeps data/volumes. Only `./ds reset`** (`down -v`, prompts for confirmation) wipes DB data plus the `.m2`/`node_modules` caches.

## Backend (hot reload)

- `backend/run.sh` runs `inotifywait` on `src/` → `mvn compile`, and Spring DevTools auto-restarts on new `target/classes`. Editing `.java` files auto-applies in the container — no manual restart is normally needed; `./ds compile` forces it.
- `./backend` is bind-mounted to `/app`; `target/` is a named volume.

## Backend stack (trust `pom.xml`, not the README)

- Spring Boot parent **3.3.4**, **Java 21**, Lombok, springdoc (Swagger UI at `/swagger-ui`), actuator (`/actuator/health`).
- JPA `ddl-auto=update` — schema auto-synced from entities, **no migration files**.
- Direct REST responses returning domain DTOs with standard HTTP status codes (no generic `ApiResponse` envelopes).
- Strict separation: Entity $\leftrightarrow$ DTO Mapper $\leftrightarrow$ Service $\leftrightarrow$ Controller/Presenter.

## Testing

- The only real test suite is Cucumber.js BDD in `testing/`; `.feature` files and steps are written in **Spanish**. It hits the live backend via `API_URL` (default `http://backend:8080`). Run with `./ds test`. Frontend tests are default Karma/Jasmine scaffolding (not exercised in the container).

## Frontend

- Angular 18 PWA, standalone components, served with `ng serve --poll 2000 --host 0.0.0.0` (hot reload). Dependencies install with **`npm install --legacy-peer-deps`**.
- Backend URL is injectable via `window.__env` (`frontend/src/assets/env.js`) / `environment.docker.ts`.
- Prefer RxJS reactive pipelines (`switchMap`, `takeUntilDestroyed`) or Angular Signals over nested subscriptions.
- Strong domain typing with TypeScript interfaces in `features/<domain>/types/`.

## Development Guidelines (SOLID & Clean Code)

- El desarrollo en todo el proyecto (backend y frontend) debe esforzarse activamente por respetar los principios **SOLID**:
  - **S (Single Responsibility Principle - Responsabilidad Única)**: Cada clase, entidad, servicio o componente debe tener un único motivo para cambiar. Separar estrictamente entidades de dominio, DTOs, mappers, servicios de negocio y controladores/presenters.
  - **O (Open/Closed Principle - Abierto/Cerrado)**: El código debe estar abierto a la extensión pero cerrado a la modificación. El uso de DTOs y mappers desacopla la persistencia del contrato de API, permitiendo evolucionar esquemas sin romper clientes.
  - **L (Liskov Substitution Principle - Sustitución de Liskov)**: Las subclases o implementaciones deben poder sustituir a sus tipos base sin alterar el comportamiento esperado del sistema.
  - **I (Interface Segregation Principle - Segregación de Interfaces)**: Preferir contratos pequeños y específicos. Los DTOs deben solicitar y exponer únicamente los datos necesarios para la operación en cuestión.
  - **D (Dependency Inversion Principle - Inversión de Dependencias)**: Los módulos de alto nivel no deben depender de los de bajo nivel, sino de abstracciones (inyección de dependencias en Spring, interfaces de servicios y repositorios).
