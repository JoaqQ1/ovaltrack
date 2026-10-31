# language: es
Característica: Edición, desasociación e historial de jugadores de una división
  Como administrador de club
  Quiero editar los datos deportivos de un jugador, desasociarlo de una división y consultar su historial
  Para mantener el plantel actualizado conservando el registro de su paso por la división

  # Se usa un jugador propio de M19 para no alterar el plantel de Primera que usan los partidos

  Escenario: El administrador de club edita el número de camiseta y la posición de un jugador
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el jugador "Jugador" "Temporal" con email "jugador.temporal@test.com" pertenece a la division "M19"
    Cuando edita al jugador "jugador.temporal@test.com" de la division "M19" con camiseta 9 y posicion "Medio scrum"
    Entonces el sistema responde con 200
    Y el jugador "jugador.temporal@test.com" de la division "M19" figura con camiseta 9 y posicion "Medio scrum"

  Escenario: No se puede editar un jugador sin indicar su posición
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el jugador "Jugador" "Temporal" con email "jugador.temporal@test.com" pertenece a la division "M19"
    Cuando edita al jugador "jugador.temporal@test.com" de la division "M19" con camiseta 9 y posicion ""
    Entonces el sistema responde con 409 y "La posicion de la persona es obligatoria"

  Escenario: El administrador de club desasocia a un jugador de una división
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el jugador "Jugador" "Temporal" con email "jugador.temporal@test.com" pertenece a la division "M19"
    Cuando desasocia al jugador "jugador.temporal@test.com" de la division "M19"
    Entonces el sistema responde con 200 y "Jugador eliminado correctamente"

  Escenario: El historial de un jugador desasociado registra la fecha de fin de su asociación
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el historial del jugador "jugador.temporal@test.com" en la division "M19"
    Entonces el sistema responde con 200
    Y el historial tiene una asociación finalizada

  Escenario: El historial de un jugador asociado muestra su asociación vigente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el historial del jugador "jugador.uno@test.com" en la division "Primera"
    Entonces el sistema responde con 200
    Y el historial tiene una asociación vigente

  Escenario: No se puede desasociar a un jugador que ya fue desasociado
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando desasocia al jugador "jugador.temporal@test.com" de la division "M19"
    Entonces el sistema responde con 409 y "No se puede desasociar un jugador que ya no esta asociado a la division"

  Escenario: No se puede editar una asociación de jugador inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando edita la asociación de jugador inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "Jugador no encontrado en la division"

  Escenario: No se puede desasociar una asociación de jugador inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando desasocia la asociación de jugador inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "No se puede desasociar un jugador que no existe"
