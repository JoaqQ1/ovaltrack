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
| Trelew Rugby Club   | 2026-10-21T14:00:00 | Primera        |
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

Esquema del escenario: Cancelar un partido
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Y que existe un partido contra "<nombreRival>" para el "<fechaPartido>" en la division "<nombreDivision>"
Cuando intenta cancelar el partido
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Cancelacion de partidos
| nombreRival       | fechaPartido        | nombreDivision | estadoCodigo |
| Trelew Rugby Club | 2026-10-21T14:00:00 | Primera        | 200          |
