# language: es
Característica: Invitaciones no permitidas
  Como administrador de club
  Quiero que el sistema evite invitaciones duplicadas o innecesarias
  Para no enviar más de un acceso a la misma persona

  # La primera invitación se inserta en la base: enviarla por la API exige un servidor de mail
  Escenario: No se puede invitar dos veces al mismo jugador a la misma división
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el jugador con email "jugador.uno@test.com" ya fue invitado a la division "Primera"
    Y lista a los jugadores
    Cuando invita al jugador "Blue" "Album" "jugador.uno@test.com" "1985-03-15" a crearse una cuenta
    Entonces el sistema responde con 409 y "Esta persona ya fue invitada a la división."

  Escenario: No se puede invitar a una persona que ya tiene una cuenta vinculada
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando invita a la persona con email "felipe.conte@test.com" a la division "Primera"
    Entonces el sistema responde con 409 y "La persona ya se encuentra asociado"
