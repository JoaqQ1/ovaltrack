# language: es
Característica: Finalización de un partido
  Como entrenador o analista de una división
  Quiero finalizar el partido en curso
  Para habilitar la auditoría post-partido y las estadísticas

  Escenario: El entrenador finaliza un partido en curso
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Bigornia Club"
    Y que el partido está en curso
    Cuando intenta finalizar el partido
    Entonces el sistema responde con 200 y devuelve el partido en estado "FINISHED" contra el rival "Bigornia Club"

  Escenario: No se puede finalizar dos veces el mismo partido
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Bigornia Club"
    Y que el partido está en curso
    Y que el partido está finalizado
    Cuando intenta finalizar el partido
    Entonces el sistema responde con 409 y "No se puede asignar el mismo estado al partido"

  Escenario: No se puede finalizar un partido cancelado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Bigornia Club"
    Y que el partido está cancelado
    Cuando intenta finalizar el partido
    Entonces el sistema responde con 409 y "No se puede modificar un partido cancelado"

  Escenario: No se puede cancelar un partido que ya terminó
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Bigornia Club"
    Y que el partido está en curso
    Y que el partido está finalizado
    Cuando intenta cancelar el partido
    Entonces el sistema responde con 409 y "No se puede cancelar un partido que ya termino"

  Escenario: No se puede finalizar un partido cuyo plantel no fue asignado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Cuando intenta finalizar el partido
    Entonces el sistema responde con 409 y "No se puede finalizar un partido cuyo plantel no fue asignado."
