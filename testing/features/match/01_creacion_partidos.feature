# language: es
Característica: Creación y programación de partidos
  Como entrenador o analista de una división
  Quiero programar y dar de alta los partidos de mi equipo
  Para organizar el calendario deportivo y preparar la posterior captura en vivo

  Escenario: Creación exitosa de un único partido para una división
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando programa un partido contra el rival "Trelew Rugby Club" para la fecha "2026-10-15T15:30:00" en la división "Primera"
    Entonces el sistema responde con código 200 y devuelve el partido creado con rival "Trelew Rugby Club" y estado "NOT_STARTED"

  Escenario: Creación de múltiples partidos para una división usando una tabla
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando programa los siguientes partidos para la división "Primera":
      | rival              | fecha               |
      | Bigornia Club      | 2026-10-22T15:30:00 |
      | Chenque Rugby Club | 2026-10-29T16:00:00 |
      | Patoruzú RC        | 2026-11-05T15:00:00 |
    Entonces el sistema responde con código 200 confirmando la creación exitosa de todos los partidos

  Escenario: Error al intentar programar dos partidos con solapamiento horario en la misma división
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta programar un partido contra "Draig Goch" para el "2026-10-22T16:00:00" en la división "Primera"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "Ya existe un partido planeado en esa franja horaria"

  Escenario: Error al intentar programar un partido en una división que no existe
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta programar un partido contra "Rival Fantasma" asociándolo a un ID de división inexistente
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "No se puede asociar un partido a una division que no existe"
