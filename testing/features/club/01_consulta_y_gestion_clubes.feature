# language: es
Característica: Consulta y gestión de clubes
  Como usuario de OvalTrack
  Quiero consultar los clubes y los miembros de mi club, y como administrador mantener sus datos
  Para conocer la organización de la plataforma y mantenerla actualizada

  # --- CONSULTAS ---

  Escenario: El administrador de club consulta los miembros de su club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los miembros de su club
    Entonces el sistema responde con 200
    Y la lista de miembros incluye:
      | email                 | rol           |
      | felipe.conte@test.com | COACH_ANALYST |
      | jugador.uno@test.com  | PLAYER        |
      | jugador.dos@test.com  | COACH_ANALYST |
    Y la lista de miembros no incluye a "admin_multiclub@test.com"

  Escenario: Consulta del listado de clubes
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el listado de clubes
    Entonces el sistema responde con 200
    Y el listado de clubes incluye a "PMRC" y "TRC"

  Escenario: Consulta de un club por su ID
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el club "PMRC" por su ID
    Entonces el sistema responde con 200
    Y el club devuelto es "PMRC" de la ciudad "Puerto Madryn"

  Escenario: Consulta de un club inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el club inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "Club no encontrado"

  Escenario: Consulta de los clubes activos
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los clubes activos
    Entonces el sistema responde con 200
    Y el listado de clubes incluye a "PMRC" y "TRC"
    Y el listado de clubes no incluye a "Club Rechazado"

  Escenario: Las opciones de registro muestran solo clubes activos sin necesidad de sesión
    Dado un usuario sin sesión iniciada en la plataforma
    Cuando consulta los clubes disponibles para registrarse
    Entonces el sistema responde con 200
    Y el listado de clubes incluye a "PMRC" y "TRC"
    Y el listado de clubes no incluye a "Club Rechazado"

  # --- EDICIÓN Y ELIMINACIÓN ---

  Escenario: El administrador de club actualiza los datos de contacto de su club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando actualiza el teléfono de contacto del club "PMRC" a "+542804999999"
    Entonces el sistema responde con 200
    Y el club "PMRC" figura con el teléfono de contacto "+542804999999"

  Escenario: Edición de un club inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando edita el club inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "Club no encontrado"

  Escenario: Eliminación de un club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el club "Club Descartable" de la ciudad "Rawson" administrado por "admin.descartable@test.com"
    Cuando elimina el club "Club Descartable"
    Entonces el sistema responde con 200 y "Club eliminado correctamente"
    Y el club eliminado ya no puede consultarse

  Escenario: Eliminación de un club inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando elimina el club inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "Club no encontrado"
