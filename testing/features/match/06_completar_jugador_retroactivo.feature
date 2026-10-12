# language: es
Característica: Completar jugador asociado a un evento post-partido
  Como entrenador o analista
  Quiero completar el jugador asociado a un evento que quedó sin asignar durante la carga en vivo
  Para tener el dato completo y mantener las estadísticas individuales actualizadas

  Escenario: Asignar retroactivamente un jugador a un evento sin jugador y actualizar la asignación
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento       | posesion | tiempo_segundos | periodo |
      | Tackle completado | OWN      | 450             | 1       |
    Cuando el entrenador edita el evento "Tackle completado" asignándole el jugador "Juan Pérez"
    Entonces el sistema responde con código 200
    Y la línea de eventos refleja que el evento modificado está asignado a "Juan Pérez"

  Escenario: Distinción visual e identificación de eventos sin jugador
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Comodoro Rugby Club"
    Y que se han registrado eventos con y sin jugador asignado para el partido
    Cuando el entrenador consulta la línea de eventos del partido cerrado
    Entonces el sistema responde con código 200
    Y se identifican claramente los eventos que no tienen jugador asignado

  Escenario: El evento completado con jugador persiste y refleja su impacto individual en la consulta de eventos
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Calafate RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Try         | OWN      | 600             | 1       |
    Cuando el entrenador edita el evento "Try" asignándole el jugador "Juan Pérez"
    Entonces el sistema responde con código 200
    Y la línea de eventos refleja que el evento modificado está asignado a "Juan Pérez"
    Y el jugador "Juan Pérez" queda vinculado como autor de la acción en el evento
