# language: es
Característica: Creación y programación de partidos
Como entrenador o analista de una división
Quiero programar y dar de alta los partidos de mi equipo
Para organizar el calendario deportivo y preparar la posterior captura en vivo

Esquema del escenario: Creación exitosa de un único partido para una división
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando programa un partido contra el rival "<nombreRival>" para la fecha "<fechaPartido>" en la división "<nombreDivision>"
Entonces el sistema responde con 200 y devuelve el partido en estado "NOT_STARTED" contra el rival "<nombreRival>"
Ejemplos: Creacion de partidos
| nombreRival         | fechaPartido        | nombreDivision |
| Bigornia Club       | 2026-11-22T15:30:00 | Primera        |
| Chenque Rugby Club  | 2026-11-29T16:00:00 | Primera        |
| Patoruzú Rugby Club | 2026-12-05T15:00:00 | Primera        |

Escenario: Error al intentar programar dos partidos con solapamiento horario en la misma división
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta programar un partido contra "Deportivo Portugués" para el "2026-11-22T16:00:00" en la división "Primera"
Entonces el sistema responde con 409 y "Ya existe un partido planeado en esa franja horaria"

Escenario: Error al intentar programar un partido en una división que no existe
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta programar un partido contra "Calafate Rugby Club" asociándolo a un ID de división inexistente
Entonces el sistema responde con 409 y "No se puede asociar un partido a una division que no existe"
