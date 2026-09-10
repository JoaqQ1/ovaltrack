# Arquitectura de Autenticación y Control de Acceso (HU-1.4)

## 1. Visión General
El sistema implementa una arquitectura de seguridad *stateless* basada en **Spring Security**, **JSON Web Tokens (JWT)** y hashing con **BCrypt**.

El modelo separa explícitamente las responsabilidades de **acceso y credenciales al sistema** (`User`) de la **identidad física en el dominio deportivo** (`Person`).

## 2. Componentes Clave

* **`User` (Cuenta de Acceso / Seguridad)**:
  * Entidad encargada exclusivamente del inicio de sesión y control de acceso.
  * Atributos: `loginEmail`, `passwordHash`, `role`, `active`, `createdAt`.
  * Relación: `@OneToOne` obligatoria y única hacia `Person` (`person_id`). Toda cuenta de usuario representa exactamente a una persona.
* **`Person` (Identidad Física / Dominio)**:
  * Entidad del dominio deportivo (jugadores, entrenadores, personal del club).
  * Atributos: `firstName`, `lastName`, `birthDate`, `contactEmail`, `contactPhone`, `createdAt`.
  * Representa al individuo en el club. Puede existir sin una cuenta de usuario asociada (ej: jugadores menores en categorías formativas que no acceden al sistema).
* **`UserRole`**:
  * Define los niveles de autorización: `ADMIN_OVALTRACK`, `ADMIN_CLUB`, `COACH_ANALYST`, `PLAYER`.
* **`BCryptPasswordEncoder`**:
  * Hashing unidireccional con sal aleatoria para el almacenamiento seguro de contraseñas en `User.passwordHash`.
* **`JwtService`**:
  * Emisión y validación criptográfica (HMAC-SHA256) de tokens.
  * **Payload y Claims**:
    * `sub`: Email de login del usuario (`loginEmail`).
    * `userId`: Identificador único de la cuenta (`UUID`).
    * `personId`: Identificador único de la persona asociada (`UUID`), permitiendo a los controladores y servicios identificar al actor deportivo sin consultar la base de datos.
    * `role`: Rol del usuario en el sistema.
    * `iat` / `exp`: Timestamps de emisión y expiración (24 horas por defecto).
* **`JwtAuthenticationFilter`**:
  * Interceptor por petición (`OncePerRequestFilter`) que parsea el header `Authorization: Bearer <token>`, valida la firma criptográfica y la vigencia, y registra la autoridad con prefijo `ROLE_` en el `SecurityContextHolder`.
* **`CorsConfig`**:
  * Manejo de orígenes cruzados con precedencia máxima para admitir peticiones preflight (`OPTIONS`) y headers de autorización.

## 3. Flujo de Autenticación y Registro

* **Registro (`POST /api/auth/register`)**:
  1. Valida que el email no esté en uso.
  2. Crea y persiste la entidad física `Person` con los datos personales y de contacto.
  3. Crea y persiste la cuenta `User` vinculada a dicha `Person` con la contraseña hasheada.
  4. Retorna el token JWT generado en formato plano: `{ "token": "..." }`.
* **Inicio de Sesión (`POST /api/auth/login`)**:
  1. Busca al `User` por su `loginEmail`.
  2. Valida la contraseña contra el `passwordHash` mediante `BCrypt`.
  3. Emite y retorna el token JWT: `{ "token": "..." }`.
* **Recuperación de Contraseña (`POST /api/auth/password-reset/request`)**:
  * Acepta la solicitud y retorna código `202 Accepted`.

## 4. Entornos y Perfiles

* **Producción / Staging (`!dev`)**: Rutas privadas protegidas; exige token Bearer válido en cada solicitud.
* **Desarrollo / Docker (`dev`, `docker`)**: Rutas públicas y bypass mediante `DevMockAuthFilter`, inyectando un usuario administrativo de pruebas para agilizar el trabajo del equipo sin requerir login manual.