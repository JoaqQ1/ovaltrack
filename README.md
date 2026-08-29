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
chmod +x ds.sh
```

4. **Levantar el entorno completo**

```bash
./ds.sh up
```

## Servicios y accesos

Una vez ejecutado ./ds.sh up, los servicios quedan disponibles en:
| Servicio | URL / Host | Puerto | Descripción |
| :--- | :--- | :--- | :--- |
| **Frontend** | `http://localhost:4200` | `4200` | Angular 18 PWA con hot-reload |
| **Backend API** | `http://localhost:8080` | `8080` | Spring Boot 3 API |
| **Health Check** | `http://localhost:8080/actuator/health` | `8080` | Estado de salud y conexión a BD |
| **PostgreSQL** | `localhost:5432` | `5432` | Base de datos relacional |

## Gestión del entorno con `ds.sh`

El script ds.sh centraliza la administración de los contenedores y herramientas de desarrollo:

```bash
./ds.sh <comando> [opciones]
```

### Comandos disponibles

| Comando            | Descripción                                                                    |
| :----------------- | :----------------------------------------------------------------------------- |
| `./ds.sh up`       | Construye imágenes (si es necesario) y levanta los servicios en segundo plano. |
| `./ds.sh down`     | Detiene los contenedores sin eliminar datos ni volúmenes.                      |
| `./ds.sh ps`       | Lista el estado y los puertos de los contenedores activos.                     |
| `./ds.sh compile`       | Compila el backend Java dentro del contenedor (mvn compile -DskipTests) y dispara el hot-reload de DevTools. |
| `./ds.sh mvn <argumentos>`       | Ejecuta comandos Maven dentro del contenedor backend (ej: ``./ds.sh mvn clean package``). |
| `./ds.sh logs [servicio]`     | Muestra los logs en vivo de todos los servicios (ej. `./ds.sh logs backend`).  |
| `./ds.sh restart [servicio]`  | Reinicia todos los servicios o uno específico (ej: ``./ds.sh restart backend``).      |
| `./ds.sh build [servicio]`    | Reconstruye las imágenes de Docker.                            |
| `./ds.sh db`       | Abre una consola interactiva `psql` conectada a PostgreSQL.                    |
| `./ds.sh backend`  | Abre una terminal interactiva dentro del contenedor del backend.               |
| `./ds.sh frontend` | Abre una terminal interactiva dentro del contenedor del frontend.              |
| `./ds.sh test`     | Ejecuta la suite de pruebas automatizadas contra la API.                       |
| `./ds.sh reset`    | Detiene el entorno y borra los volúmenes de datos (pide confirmación).         |


## Flujo de Desarrollo Habitual 
   1. **Iniciar el entorno:**
      ```bash
         ./ds.sh up
      ```
      * Frontend: http://localhost:4200

      * Backend API: http://localhost:8080

      * Base de datos: localhost:5432
   2. **Aplicar cambios en Java (Backend):**
         Tras modificar archivos ``.java`` en ``backend/src/``:
      ```bash
         ./ds.sh compile
      ```
   3. **Ejecutar pruebas BDD (Cucumber.js):**
      ```bash
         ./ds.sh test
      ```

## Gestión de Base de Datos y Reset

#### Resetear datos de prueba

Para limpiar el contenido de PostgreSQL y reiniciar las tablas desde cero sin reinstalar dependencias de desarrollo (`node_modules` o `.m2`):

```bash
./ds.sh reset
```

#### Conexión desde clientes externos (DBeaver / DataGrip)

- Host: `localhost`
- Puerto: `5432`
- Base de datos: `ovaltrack`
- Usuario: `APP`(o el valor asignado en `DB_USER`)
- Contraseña: `APP`(o el valor asignado en `DB_PASWORD`)

## Estructura del proyecto

```text
├── backend/               # Código fuente Spring Boot (Java 21, Maven)
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/              # Código fuente Angular 18 (PWA, CSS)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── testing/               # Suite de tests automatizados
├── .env.example           # Plantilla de variables de entorno
├── docker-compose.yml     # Orquestación de servicios
├── ds.sh                  # Script CLI de gestión
└── README.md
```


## Arquitectura y Comunicación de Contenedores

Los 3 servicios principales se ejecutan en contenedores aislados y se comunican a través de la red interna de Docker (`ovaltrack-net`), exponiendo únicamente los puertos necesarios hacia la máquina anfitriona (Host).

```text
+-----------------------------------------------------------------------------------+
|                                 MÁQUINA HOST                                      |
|                                                                                   |
|    +------------------------+                           +--------------------+    |
|    | Navegador Web (Cliente)|                           | DBeaver / DataGrip |    |
|    +-----------+------------+                           +---------+----------+    |
+----------------|--------------------------------------------------|---------------+
                 |                                                  |
                 | HTTP                                             | JDBC (5432)
                 v                                                  |
+-------------------------------------------------------------------|---------------+
| RED DOCKER (ovaltrack-net)                                        |               |
|                                                                   v               |
|  +---------------------------+        REST / JSON      +-----------------------+  |
|  |     ovaltrack-frontend    | ----------------------> |   ovaltrack-backend   |  |
|  |     (Angular 18 PWA)      |                         | (Spring Boot 3 / J21) |  |
|  |     Puerto: 4200          |                         | Puerto: 8080          |  |
|  +---------------------------+                         +-----------+-----------+  |
|                                                                    |              |
|                                                                    | JDBC         |
|                                                                    | (db:5432)    |
|                                                                    v              |
|                                                        +-----------------------+  |
|                                                        |     ovaltrack-db      |  |
|                                                        |    (PostgreSQL 16)    |  |
|                                                        |     Puerto: 5432      |  |
|                                                        +-----------------------+  |
+-----------------------------------------------------------------------------------+
```
## Flujo de Comunicación
1. **Frontend** (``ovaltrack-frontend``):
   * Servido en http://localhost:4200 mediante Angular CLI (``ng serve``).
   * La aplicación web se ejecuta en el navegador del host y envía peticiones HTTP/REST al backend en http://localhost:8080 (o mediante el proxy configurado).
2. **Backend** (``ovaltrack-backend``):
   * Servidor Spring Boot 3 expuesto en http://localhost:8080.
   * Se conecta a la base de datos de manera interna dentro de la red Docker utilizando el hostname de servicio jdbc:postgresql://db:5432/ovaltrack.
3. **Base de Datos** (``ovaltrack-db``):
   * PostgreSQL 16 expuesto en el puerto 5432 tanto para la red interna de Docker como para clientes externos de administración (DBeaver, DataGrip, psql). 
   * Almacena datos persistentes en el volumen nombrado ovaltrack_db_data.
