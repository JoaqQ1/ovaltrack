# language: es
Característica: Creación de divisiones y restricciones de rol y pertenencia a club
  Como administrador de club
  Quiero crear divisiones para mi club
  Para organizar las categorías deportivas asegurando que solo los administradores puedan crearlas en su propio club

  Escenario: El administrador de club crea las divisiones de su club exitosamente
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando crea las siguientes divisiones para su club:
      | nombre  | categoria | genero |
      | Primera | SENIOR    | MALE   |
      | M19     | U20       | MALE   |
    Entonces el sistema confirma la creación exitosa de las divisiones

  Escenario: El administrador de otro club crea una división para su respectivo club
    Dado que el administrador de club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando crea las siguientes divisiones para su club:
      | nombre           | categoria | genero |
      | Plantel Superior | SENIOR    | MALE   |
    Entonces el sistema confirma la creación exitosa de las divisiones

  Escenario: Error al intentar crear una división con nombre duplicado en el mismo club
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando intenta crear una división con nombre "Primera", categoría "SENIOR" y género "MALE"
    Entonces el sistema rechaza la creación de la división informando que ya existe

  Escenario: Un administrador no puede crear una división en un club ajeno
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando intenta crear una división "M17" asignándola al club de "admin_multiclub@test.com"
    Entonces el sistema rechaza la acción con error de autorización 403

  Escenario: Un usuario con rol jugador no puede crear divisiones
    Dado que el usuario con rol jugador con email "usuario.norole@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta enviar la solicitud para crear la división "Juveniles" con categoría "U18" y género "MALE"
    Entonces el sistema rechaza la acción con error de autorización 403

  Escenario: Un usuario con rol entrenador no puede crear divisiones
    Dado que el usuario con rol entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta enviar la solicitud para crear la división "M15" con categoría "U15" y género "MALE"
    Entonces el sistema rechaza la acción con error de autorización 403
