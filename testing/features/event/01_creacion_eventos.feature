# language: es
Característica: Registro de eventos en un partido
  Como entrenador o analista
  Quiero registrar las acciones y eventos tácticos que ocurren en el partido
  Para documentar las jugadas y habilitar el posterior análisis estadístico

  Escenario: Registro exitoso de un evento individual en un partido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Trelew Rugby Club"
    Cuando registra el evento "Try" para el equipo propio en el minuto 10 del periodo 1
    Entonces el sistema responde con código 200 y devuelve el evento creado con periodo 1 y posesión "OWN"

  Escenario: Registro de múltiples eventos tácticos del primer tiempo usando una tabla
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Trelew Rugby Club"
    Cuando registra los siguientes eventos para el partido:
      | tipo_evento        | posesion  | tiempo_segundos | periodo |
      | Try                | OWN       | 300             | 1       |
      | Tackle completado  | OPPONENT  | 480             | 1       |
      | Tackle fallado     | OPPONENT  | 840             | 1       |
      | Turnover           | NEUTRAL   | 1080            | 1       |
      | Penal a los palos  | OWN       | 1500            | 1       |
      | Penal / infracción | OPPONENT  | 1860            | 1       |
      | Scrum              | NEUTRAL   | 2160            | 1       |
    Entonces el sistema responde con código 200 confirmando el registro de todos los eventos
    Y el partido cuenta con 8 eventos registrados para el periodo 1

  Escenario: Error al intentar registrar un evento con tipo de evento inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Trelew Rugby Club"
    Cuando intenta registrar un evento de tipo desconocido con ID inexistente
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "No se puede crear un nuevo evento a partir de un tipo de evento que no existe"

  Escenario: Error al intentar registrar un evento en un partido cancelado
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en estado cancelado para la división "Primera" contra "Rival Cancelado"
    Cuando intenta registrar un evento para ese partido cancelado
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "No se puede asignar un evento a un partido cancelado"
