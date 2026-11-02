# language: es
Característica: Inicio de un partido programado
  Como entrenador o analista
  Quiero iniciar un partido solo cuando tiene su plantel cargado
  Para que la captura en vivo pueda asignar los eventos a los jugadores titulares

  Escenario: No se puede iniciar un partido sin jugadores titulares
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido contra "Trelew Rugby Club" para el "2027-06-05T15:30:00" en la division "Primera"
    Cuando intenta iniciar el partido
    Entonces el sistema responde con 409 y "No se puede iniciar el partido sin al menos un jugador titular registrado."

  Escenario: Un partido con plantel cargado se inicia correctamente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido contra "Trelew Rugby Club" para el "2027-06-12T15:30:00" en la division "Primera"
    Y el plantel del partido tiene como titulares a los jugadores de la division
    Cuando intenta iniciar el partido
    Entonces el sistema responde con 200 y devuelve el partido en estado "IN_PROGRESS" contra el rival "Trelew Rugby Club"
