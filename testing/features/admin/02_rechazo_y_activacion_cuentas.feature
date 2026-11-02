# language: es
Característica: Rechazo de solicitudes y activación de cuentas desde el panel de OvalTrack
  Como administrador de OvalTrack
  Quiero rechazar solicitudes de alta y activar o desactivar cuentas
  Para controlar qué clubes y administradores acceden a la plataforma

  # --- RECHAZO DE SOLICITUDES ---

  Escenario: El administrador de OvalTrack rechaza la solicitud de una cuenta
    Dado que el administrador de OvalTrack ha iniciado sesión
    Y que el club "Club Rechazado" de la ciudad "Rawson" solicitó su alta con el administrador "admin.rechazado@test.com"
    Cuando rechaza la solicitud de la cuenta "admin.rechazado@test.com"
    Entonces el sistema responde con 200 y "La cuenta fue rechazada."
    Y la cuenta "admin.rechazado@test.com" ya no figura entre las solicitudes pendientes

  Escenario: El administrador de OvalTrack rechaza la solicitud de un club
    Dado que el administrador de OvalTrack ha iniciado sesión
    Y que el club "Club Rechazado" de la ciudad "Rawson" solicitó su alta con el administrador "admin.rechazado@test.com"
    Cuando rechaza la solicitud del club "Club Rechazado"
    Entonces el sistema responde con 200 y "El club fue rechazado."
    Y el club "Club Rechazado" figura entre los clubes rechazados

  Escenario: Rechazo de una cuenta inexistente
    Dado que el administrador de OvalTrack ha iniciado sesión
    Cuando rechaza la cuenta inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "El usuario no existe"

  Escenario: Rechazo de un club inexistente
    Dado que el administrador de OvalTrack ha iniciado sesión
    Cuando rechaza el club inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "El club no existe"

  # --- ACTIVACIÓN Y DESACTIVACIÓN DE CUENTAS ---

  Escenario: El administrador de OvalTrack desactiva una cuenta activa
    Dado que el administrador de OvalTrack ha iniciado sesión
    Y que la cuenta "admin.temporal@test.com" del club "Club Temporal" de la ciudad "Gaiman" fue aprobada
    Cuando desactiva la cuenta "admin.temporal@test.com"
    Entonces el sistema responde con 200 y "La cuenta del usuario a sido desactivada correctamente."
    Y la cuenta "admin.temporal@test.com" figura entre las cuentas revisadas como "inactiva"

  Escenario: Desactivación de una cuenta que ya está inactiva
    Dado que el administrador de OvalTrack ha iniciado sesión
    Cuando desactiva la cuenta "admin.temporal@test.com"
    Entonces el sistema responde con 409 y "El usuario ya se encuentra dado de baja"

  Escenario: El administrador de OvalTrack activa una cuenta inactiva
    Dado que el administrador de OvalTrack ha iniciado sesión
    Cuando activa la cuenta "admin.temporal@test.com"
    Entonces el sistema responde con 200 y "La cuenta del usuario a sido activada correctamente."
    Y la cuenta "admin.temporal@test.com" figura entre las cuentas revisadas como "activa"

  Escenario: Activación de una cuenta que ya está activa
    Dado que el administrador de OvalTrack ha iniciado sesión
    Cuando activa la cuenta "admin.temporal@test.com"
    Entonces el sistema responde con 409 y "El usuario ya se encuentra dado de alta"
