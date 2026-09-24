# language: es
Característica: Validación de seguridad y pertenencia a división y club
  Como sistema
  Quiero validar en cada request que el usuario tiene el rol y la pertenencia a club/división requerida
  Para evitar accesos indebidos aunque se manipule el frontend

  Escenario: El administrador de club puede consultar las divisiones de su propio club
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando consulta el listado de divisiones de su club
    Entonces el sistema responde con código 200 y devuelve las divisiones del club

  Escenario: El administrador asigna un entrenador a una división y dicho entrenador consulta su división asignada
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que el usuario con email "jugador.uno@test.com" tiene el rol de entrenador
    Cuando el administrador asigna a "jugador.uno@test.com" como entrenador de la división "Primera"
    Y el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" inicia sesión
    Y consulta los datos de la división "Primera"
    Entonces el sistema responde con código 200 y permite el acceso a la división

  Escenario: Un entrenador no puede consultar los datos ni jugadores de una división que no tiene asignada
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta consultar los jugadores de la división "M19"
    Entonces el sistema rechaza el acceso con error de autorización 403

  Escenario: Un administrador de club no puede consultar divisiones de otro club
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando intenta consultar los datos de la división "Plantel Superior" perteneciente al club de "admin_multiclub@test.com"
    Entonces el sistema rechaza el acceso con error de autorización 403

  Escenario: Un usuario con rol Jugador no puede acceder a las divisiones
    Dado que el usuario con rol jugador con email "usuario.norole@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta consultar las divisiones del club
    Entonces el sistema rechaza el acceso con error de autorización 403

  Escenario: Una solicitud sin autenticación es rechazada
    Dado un usuario sin sesión iniciada en la plataforma
    Cuando intenta consultar los datos de la división "Primera"
    Entonces el sistema rechaza la acción solicitando autenticación
