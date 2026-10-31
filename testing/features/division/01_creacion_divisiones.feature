# language: es
Característica: Creación de divisiones y restricciones de rol y pertenencia a club
Como administrador de club
Quiero crear divisiones para mi club
Para organizar las categorías deportivas asegurando que solo los administradores puedan crearlas en su propio club

Esquema del escenario: El administrador de club crea las divisiones de su club exitosamente
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta crear la division con nombre "<nombreDivision>", categoria "<categoriaDivision>" y genero "<generoDivision>"
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"
Ejemplos: Alta de divisiones
| nombreDivision | categoriaDivision | generoDivision | estadoCodigo | estadoTexto |
| Primera        | SENIOR            | MALE           | 200          | pepe        |
| M19            | U20               | MALE           | 200          | pepe        |

Esquema del escenario:  El administrador de otro club crea una división para su respectivo club
Dado que el administrador del club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta crear la division con nombre "<nombreDivision>", categoria "<categoriaDivision>" y genero "<generoDivision>"
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"
Ejemplos: Alta de divisiones
| nombreDivision  | categoriaDivision | generoDivision | estadoCodigo | estadoTexto |
| Primera | SENIOR    | MALE   | 200          | pepe        |

Escenario: Error al intentar crear una división
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta crear la division con nombre "<nombreDivision>", categoria "<categoriaDivision>" y genero "<generoDivision>"
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"
Ejemplos: Alta de divisiones incorrectas
| nombreDivision | categoriaDivision | generoDivision | estadoCodigo | estadoTexto                                       |
|                | SENIOR            | MALE           | 409          | No se puede crear una division que ya esta activa |
| Primera        |                   | MALE           | 409          | No se puede crear una division que ya esta activa |
| Primera        | SENIOR            |                | 409          | No se puede crear una division que ya esta activa |
| Primera        | SENIOR            | MALE           | 409          | No se puede crear una division que ya esta activa |

Escenario: Un administrador no puede crear una división en un club ajeno
Dado que el administrador del club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
Cuando intenta crear una división "M17" asignándola al club de "admin_multiclub@test.com"
Entonces el sistema rechaza la solicitud con código 403 y el mensaje "Acceso denegado: no puede crear divisiones en otro club"

