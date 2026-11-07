# language: es
Característica: Consulta de los jugadores de una división
  Como administrador de club
  Quiero consultar los jugadores de una división
  Para armar la nómina de los partidos y revisar el plantel

  Escenario: El listado de jugadores de la división se pagina
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la página 0 de 10 jugadores de la division "Primera"
    Entonces el sistema responde con 200
    Y la página tiene 10 jugadores de 17 en total

  Escenario: La última página trae los jugadores restantes
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la página 1 de 10 jugadores de la division "Primera"
    Entonces el sistema responde con 200
    Y la página tiene 7 jugadores de 17 en total

  Escenario: Los jugadores disponibles de la división incluyen nombre y posición
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los jugadores disponibles de la division "Primera"
    Entonces el sistema responde con 200
    Y la lista incluye al jugador "Blue Album" en la posición "Pilar"

  Escenario: No se puede consultar una asociación de jugador inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la asociación de jugador inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "No se encontro al jugador asociado a la division"

  Escenario: Un administrador de otro club no puede listar los jugadores de la división
    Dado que el administrador del club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la página 0 de 10 jugadores de la division "Primera" del club "PMRC"
    Entonces el sistema responde con 403

  Escenario: Un administrador de otro club no puede ver los jugadores disponibles de la división
    Dado que el administrador del club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los jugadores disponibles de la division "Primera" del club "PMRC"
    Entonces el sistema responde con 403
