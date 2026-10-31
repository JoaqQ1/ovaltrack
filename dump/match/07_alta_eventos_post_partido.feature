# language: es
@hu-8.4
Característica: Alta de eventos no cargados en vivo post-partido (HU 8.4)
  Como entrenador o analista
  Quiero agregar eventos que no llegué a cargar durante el partido
  Para que las estadísticas y la línea cronológica reflejen lo que realmente pasó

  # --- HAPPY PATHS ---

  Escenario: Alta exitosa de un evento con jugador en un partido cerrado
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador agrega post-partido el evento "Try" para el equipo propio con el jugador "Juan Pérez" en el minuto 15 del periodo 1
    Entonces el sistema responde con código 200
    Y la línea de eventos refleja el nuevo evento "Try" en el periodo 1 asignado a "Juan Pérez"
    Y el evento agregado se identifica con origen post-partido

  Escenario: Alta exitosa de un evento sin jugador asignado en un partido cerrado
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Comodoro Rugby Club"
    Cuando el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio sin jugador en el minuto 20 del periodo 1
    Entonces el sistema responde con código 200
    Y la línea de eventos refleja el nuevo evento "Tackle completado" sin jugador asignado
    Y el evento agregado se identifica con origen post-partido

  Escenario: Integración de evento agregado al cálculo del tanteador y estadísticas
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Calafate RC" con tanteador 0 a 0
    Cuando el entrenador agrega post-partido el evento "Try" para el equipo propio con el jugador "Juan Pérez" en el minuto 10 del periodo 1
    Entonces el sistema responde con código 200
    Y el tanteador propio del partido se actualiza correctamente sumando los puntos

  Escenario: Distinción entre eventos cargados en vivo y eventos agregados post-partido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Patoruzú RC"
    Y que se han registrado eventos en vivo para el partido
    Cuando el entrenador agrega post-partido el evento "Penal a los palos" para el equipo propio en el minuto 30 del periodo 1
    Y el entrenador consulta la línea de eventos del partido cerrado
    Entonces se distingue claramente el evento cargado en vivo del evento agregado post-partido

  # --- SAD PATHS ---

  Escenario: Error al intentar agregar un evento post-partido con un jugador que no pertenece al plantel
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador intenta agregar post-partido el evento "Try" con un jugador fuera del plantel
    Entonces el sistema rechaza la solicitud con código 400 o 409

  Escenario: Error al intentar agregar un evento post-partido con un tipo de evento inválido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador intenta agregar post-partido un evento con un ID de tipo de evento inválido
    Entonces el sistema rechaza la solicitud con código 404 o 409

  Escenario: Error de seguridad al intentar agregar un evento post-partido en un partido de otro club
    Dado que el entrenador del club "Bigornia Club" con email "rival@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado del club ajeno contra "Trelew Rugby Club"
    Cuando el entrenador intenta agregar un evento post-partido a ese partido ajeno
    Entonces el sistema rechaza la solicitud con código 403 o 404
