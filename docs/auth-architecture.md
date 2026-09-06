# Arquitectura de Autenticación y Control de Acceso (HU-1.4)

## 1. Visión General
El sistema implementa una arquitectura de seguridad stateless basada en **Spring Security**, **JSON Web Tokens (JWT)** y hashing con **BCrypt**.

## 2. Componentes Clave
* **`User` / `UserRole`**: Modelo de identidad que soporta los cuatro roles (`ADMIN_OVALTRACK`, `ADMIN_CLUB`, `COACH_ANALYST`, `PLAYER`).
* **`BCryptPasswordEncoder`**: Hashing unidireccional con sal aleatoria para el almacenamiento seguro de contraseñas.
* **`JwtService`**: Emisión y validación criptográfica (HMAC-SHA256) de tokens con claims de identidad (`userId`, `role`).
* **`JwtAuthenticationFilter`**: Interceptor por petición (`OncePerRequestFilter`) que parsea el header `Authorization: Bearer <token>` y registra el `SecurityContextHolder`.
* **`CorsConfig`**: Manejo de orígenes cruzados con precedencia máxima para admitir peticiones preflight (`OPTIONS`) y headers de autorización.

## 3. Entornos y Perfiles
* **Producción / Staging (`!dev`)**: Rutas privadas protegidas; exige token Bearer válido en cada solicitud.
* **Desarrollo / Docker (`dev`, `docker`)**: Rutas públicas y bypass mediante `DevMockAuthFilter`, inyectando un usuario administrativo de pruebas para agilizar el trabajo del equipo sin requerir login manual.