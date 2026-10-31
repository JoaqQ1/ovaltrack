# language: es
Característica: Autorización de acceso a divisiones por rol, club y asignación
  Como sistema
  Quiero validar en cada solicitud el rol, el club y la asignación a la división del usuario
  Para evitar accesos indebidos aunque se manipule el frontend

  # --- ACCESOS PERMITIDOS ---

  Escenario: El administrador de club consulta las divisiones de su propio club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta las divisiones del club "PMRC"
    Entonces el sistema responde con 200
    Y el listado de divisiones incluye a "Primera" y "M19"

  Escenario: Un coach consulta la división que tiene asignada
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la division "Primera" del club "PMRC"
    Entonces el sistema responde con 200

  # --- ACCESOS RECHAZADOS ---

  Escenario: Un coach no puede consultar una división que no tiene asignada
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la division "M19" del club "PMRC"
    Entonces el sistema responde con 403 y "Acceso denegado: no es entrenador asignado a esta división"

  Escenario: Un administrador de club no puede consultar una división de otro club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la division "Primera" del club "TRC"
    Entonces el sistema responde con 403 y "Acceso denegado: la división no pertenece a su club"

  Escenario: Un administrador de club no puede listar las divisiones de otro club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta las divisiones del club "TRC"
    Entonces el sistema responde con 403 y "Acceso denegado: no pertenece al club solicitado"

  Escenario: Un jugador no puede consultar las divisiones del club
    Dado que el jugador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta las divisiones del club "PMRC"
    Entonces el sistema responde con 403 y "Acceso denegado: solo el administrador del club puede realizar esta acción"

  Escenario: Una consulta de divisiones sin sesión es rechazada
    Dado un usuario sin sesión iniciada en la plataforma
    Cuando consulta las divisiones del club "PMRC"
    Entonces el sistema responde con 401 y "No autorizado: se requiere autenticación"

  # --- CREACIÓN DE DIVISIONES POR ROL ---

  Esquema del escenario: Solo el administrador de club puede crear divisiones
    Dado que el usuario con email "<email>" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta crear la division "Juveniles" con categoria "U18" y genero "MALE" en el club "PMRC"
    Entonces el sistema responde con 403 y "Acceso denegado: solo el administrador del club puede realizar esta acción"

    Ejemplos:
      | email                 | rol           |
      | jugador.uno@test.com  | PLAYER        |
      | felipe.conte@test.com | COACH_ANALYST |
