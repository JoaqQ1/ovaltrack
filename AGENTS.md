# AGENTS.md

## Environment

- Three-service Docker monorepo: `backend/` (Spring Boot), `frontend/` (Angular 18 PWA), `testing/` (Cucumber.js). No local Java/Maven/Node/Angular toolchain — everything builds and runs in containers. Do NOT run `mvn`/`npm`/`ng` on the host (only `backend/mvnw` works directly); use `ds.sh`.
- `./ds.sh` is the single entrypoint. First `./ds.sh up` auto-creates `.env` from `.env.example`. `up` runs detached (`docker compose up -d --build`).

## Commands

- `./ds.sh up` / `down` / `ps` / `logs [svc]` / `restart [svc]` / `build [svc]` / `db` (interactive psql).
- `./ds.sh compile` — recompiles backend Java in-container (`dc exec backend mvn compile -DskipTests`).
- `./ds.sh mvn <args>` — arbitrary Maven command in the backend container.
- `./ds.sh test` — runs the `testing` service (it uses the `--profile test` compose profile); requires the backend to be up and healthy.
- **`./ds.sh down` keeps data/volumes. Only `./ds.sh reset`** (`down -v`, prompts for confirmation) wipes DB data plus the `.m2`/`node_modules` caches.

## Backend (hot reload)

- `backend/run.sh` runs `inotifywait` on `src/` → `mvn compile`, and Spring DevTools auto-restarts on new `target/classes`. Editing `.java` files auto-applies in the container — no manual restart is normally needed; `./ds.sh compile` forces it.
- `./backend` is bind-mounted to `/app`; `target/` is a named volume.

## Backend stack (trust `pom.xml`, not the README)

- Spring Boot parent **4.1.1**, **Java 21**, Lombok, springdoc (Swagger UI at `/swagger-ui`), actuator (`/actuator/health`).
- JPA `ddl-auto=update` — schema auto-synced from entities, **no migration files**.
- Root API path is `/api`. Package layout is organized by domain (`controller/`, `common/config/`, ...).

## Testing

- The only real test suite is Cucumber.js BDD in `testing/`; `.feature` files and steps are written in **Spanish**. It hits the live backend via `API_URL` (default `http://backend:8080`). Run with `./ds.sh test`. Frontend tests are default Karma/Jasmine scaffolding (not exercised in the container).

## Frontend

- Angular 18 PWA, served with `ng serve --poll 2000 --host 0.0.0.0` (hot reload). Dependencies install with **`npm install --legacy-peer-deps`**.
- Backend URL is injectable via `window.__env` (`frontend/src/assets/env.js`) / `environment.docker.ts`.
