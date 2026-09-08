# OvalTrack

Entorno de desarrollo integral para el sistema **OvalTrack**, compuesto por una API backend en **Spring Boot 3 (Java 21)**, una interfaz frontend en **Angular 18 PWA** y persistencia en **PostgreSQL 16**.

---

## Requisitos previos

- **Docker** (versión 24.x o superior)
- **Docker Compose** (v2)
- **Git**

> No se requiere tener instalados localmente Java, Maven, Node.js, Angular CLI ni PostgreSQL; todo el ciclo de compilación y ejecución se gestiona dentro de los contenedores Docker.

---

## Inicio rápido

1. **Clonar el repositorio:**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd ovaltrack
   ```

2. **Configurar variables de entorno**
   El script creará automáticamente el archivo `.env` a partir de `.env.example` en el primer inicio si no existe. Podés crearlo manualmente con:

```bash
cp .env.example .env
```

3. **Otorgar permisos de ejecución al script gestor**

```bash
chmod +x ds
```

4. **Levantar el entorno completo**

```bash
./ds up
```

## Servicios y accesos

Una vez ejecutado `./ds up` (y opcionalmente `./ds pwa`), los servicios quedan disponibles en:

| Servicio | URL / Host | Puerto | Descripción |
| :--- | :--- | :--- | :--- |
| **Frontend (Desarrollo)** | `http://localhost:4200` | `4200` | Angular 18 PWA con hot-reload |
| **Frontend (Producción)** | `http://localhost:4201` | `4201` | PWA compilada, servida por Nginx con soporte offline |
| **Backend API** | `http://localhost:8080` | `8080` | Spring Boot 3 API |
| **Health Check** | `http://localhost:8080/actuator/health` | `8080` | Estado de salud y conexión a BD |
| **PostgreSQL** | `localhost:5432` | `5432` | Base de datos relacional |

## Gestión del entorno con `ds`

El script `ds` centraliza la administración de los contenedores y herramientas de desarrollo:

```bash
./ds <comando> [opciones]
```

### Comandos disponibles

| Comando            | Descripción                                                                    |
| :----------------- | :----------------------------------------------------------------------------- |
| `./ds up`          | Construye imágenes (si es necesario) y levanta los servicios en segundo plano. |
| `./ds down`        | Detiene los contenedores sin eliminar datos ni volúmenes.                      |
| `./ds ps`          | Lista el estado y los puertos de los contenedores activos.                     |
| `./ds compile`     | Compila el backend Java dentro del contenedor y dispara el hot-reload.         |
| `./ds mvn <args>`  | Ejecuta comandos Maven dentro del contenedor backend (ej: `./ds mvn clean`).   |
| `./ds logs [svc]`  | Muestra los logs en vivo de todos los servicios o de uno específico.           |
| `./ds restart`     | Reinicia todos los servicios o uno específico.                                 |
| `./ds build [svc]` | Reconstruye las imágenes de Docker.                                            |
| `./ds db`          | Abre una consola interactiva `psql` conectada a PostgreSQL.                    |
| `./ds backend`     | Abre una terminal interactiva dentro del contenedor del backend.               |
| `./ds frontend`    | Abre una terminal interactiva dentro del contenedor del frontend.              |
| `./ds test`        | Ejecuta la suite de pruebas automatizadas contra la API.                       |
| `./ds reset`       | Detiene el entorno y borra los volúmenes de datos (pide confirmación).         |
| `./ds pwa`         | Construye y levanta la versión de producción de la PWA (Nginx) en el puerto 4201. |
| `./ds pwa-down`    | Detiene únicamente el contenedor de la PWA.                                |
| `./ds install`     | Actualiza dependencias (`npm install`) dentro del contenedor de desarrollo.|
| `./ds sync-node`   | Sincroniza `node_modules` del frontend al host para el autocompletado en VS Code. |


## Flujo de Desarrollo Habitual 
   1. **Iniciar el entorno:**
      ```bash
         ./ds up
      ```
   2. **Aplicar cambios en Java (Backend):**
      ```bash
         ./ds compile
      ```
   3. **Ejecutar pruebas BDD (Cucumber.js):**
      ```bash
         ./ds test
      ```
   4. **Probar la experiencia real PWA (Instalación y Offline):**
      ```bash
         ./ds pwa
      ```

## Gestión de Base de Datos y Dependencias

#### Resolver errores de dependencias (Angular)
Si luego de hacer un `git pull` el frontend crashea por paquetes faltantes, sincronizá el volumen interno ejecutando:
```bash
./ds install
```

#### Resetear datos de prueba
Para limpiar el contenido de PostgreSQL y reiniciar las tablas desde cero:
```bash
./ds reset
```

#### Conexión desde clientes externos (DBeaver / DataGrip)
- Host: `localhost` | Puerto: `5432` | BD: `ovaltrack` | User/Pass: `APP`

## Estructura del proyecto

```text
├── backend/               # Código fuente Spring Boot (Java 21, Maven)
├── frontend/              # Código fuente Angular 18 (PWA, CSS)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   ├── Dockerfile.pwa       # Build de producción y servidor Nginx
│   ├── nginx.conf           # Configuración de enrutamiento SPA para Nginx
│   └── pwa-entrypoint.sh    # Inyector dinámico de variables de entorno (API_URL)
├── testing/               # Suite de tests automatizados
├── .env.example           # Plantilla de variables de entorno
├── docker-compose.yml     # Orquestación de servicios
├── ds                     # Script CLI de gestión
└── README.md
```


## Arquitectura y Comunicación de Contenedores

Los servicios principales se ejecutan en contenedores aislados y se comunican a través de la red interna de Docker (`ovaltrack-net`).

```text
+-----------------------------------------------------------------------------------+
|                                 MÁQUINA HOST                                      |
|                                                                                   |
|    +------------------------+                           +--------------------+    |
|    | Navegador Web (Cliente)|                           | DBeaver / DataGrip |    |
|    +-----------+------------+                           +---------+----------+    |
+--------|-------|--------------------------------------------------|---------------+
         |       |                                                  |
    HTTP |       | HTTP                                             | JDBC (5432)
  (4200) |       | (4201)                                           |
         v       v                                                  |
+-------------------------------------------------------------------|---------------+
| RED DOCKER (ovaltrack-net)                                        |               |
|                                                                   v               |
|  +---------------------------+        REST / JSON      +-----------------------+  |
|  |     ovaltrack-frontend    | ----------------------> |   ovaltrack-backend   |  |
|  |       (Desarrollo)        |            |            | (Spring Boot 3 / J21) |  |
|  +---------------------------+            |            | Puerto: 8080          |  |
|                                           |            +-----------+-----------+  |
|  +---------------------------+            |                        |              |
|  |   ovaltrack-frontend-pwa  | -----------+                        | JDBC         |
|  |  (Nginx Producción PWA)   |                                     v              |
|  +---------------------------+                         +-----------------------+  |
|                                                        |     ovaltrack-db      |  |
|                                                        |    (PostgreSQL 16)    |  |
|                                                        +-----------------------+  |
+-----------------------------------------------------------------------------------+
```
## Flujo de Comunicación
1. **Frontend (Desarrollo)**:
   * Servido en http://localhost:4200 mediante Angular CLI (`ng serve`).
2. **Frontend (Producción PWA)**:
   * Servido en http://localhost:4201 mediante Nginx. Utiliza assets compilados y soporta Service Workers. Inyecta la URL del backend dinámicamente en tiempo de ejecución.
3. **Backend**:
   * Servidor Spring Boot 3 expuesto en http://localhost:8080.
4. **Base de Datos**:
   * PostgreSQL expuesto en el puerto 5432 para la red interna y acceso externo.
