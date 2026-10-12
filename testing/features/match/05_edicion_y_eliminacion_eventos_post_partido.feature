# language: es
Característica: Edición y eliminación de eventos post-partido (HU 8.2)
  Como entrenador o analista
  Quiero poder editar o eliminar eventos registrados en un partido ya finalizado
  Para corregir errores de carga y mantener las estadísticas precisas

  # --- HAPPY PATHS ---

  Escenario: Asignación rápida de jugador a un evento sin asignar
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Try         | OWN      | 300             | 1       |
    Cuando el entrenador edita el evento "Try" asignándole el jugador "Juan Pérez"
    Entonces el sistema responde con código 200
    Y la línea de eventos refleja que el evento modificado está asignado a "Juan Pérez"

  Escenario: Edición del tipo de evento y equipo en posesión
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Calafate RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Scrum       | NEUTRAL  | 600             | 1       |
    Cuando el entrenador edita el evento "Scrum" cambiándolo a "Lineout" con posesión "OWN"
    Entonces el sistema responde con código 200
    Y la línea de eventos refleja el cambio de tipo a "Lineout" y posesión a "OWN"

  Escenario: Eliminación lógica de un evento existente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Patoruzú RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Lineout     | OWN      | 120             | 1       |
    Cuando el entrenador elimina el evento "Lineout"
    Entonces el sistema responde con código 200
    Y al consultar la línea de eventos, la lista tiene un evento menos

  Escenario: Eliminación de un evento y recálculo del tanteador (E7/E9)
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Comodoro Rugby Club" con tanteador 5 a 0
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Try         | OWN      | 300             | 1       |
    Cuando el entrenador elimina el evento "Try"
    Entonces el sistema responde con código 200
    Y el tanteador propio del partido se actualiza correctamente descontando los puntos

  # --- SAD PATHS ---

  Escenario: Error al intentar asignar un jugador que no está en el plantel del partido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Try         | OWN      | 300             | 1       |
    Cuando el entrenador intenta editar el evento "Try" asignándole un jugador fuera del plantel
    Entonces el sistema rechaza la solicitud con código 400 o 409

  Escenario: Error al intentar enviar un tipo de evento inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Scrum       | NEUTRAL  | 100             | 1       |
    Cuando el entrenador intenta editar el evento enviando un ID de tipo de evento inválido
    Entonces el sistema rechaza la solicitud con código 404

  Escenario: Error al intentar eliminar un evento inexistente o ya eliminado
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador intenta eliminar un evento con un ID que no existe
    Entonces el sistema rechaza la solicitud con código 404

  Escenario: Error de seguridad al intentar editar o eliminar un evento de otro club
    Dado que el entrenador del club "Bigornia Club" con email "rival@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado del club ajeno contra "Trelew Rugby Club"
    Cuando el entrenador intenta eliminar un evento de ese partido
    Entonces el sistema rechaza la solicitud con código 403 o 404
