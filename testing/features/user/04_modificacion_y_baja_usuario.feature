# language: es
Característica: Modificación o baja de rol de usuario
  Como administrador de club
  Quiero modificar o dar de baja el rol de un usuario
  Para mantener los accesos actualizados sin eliminar el historial de datos asociados

  Escenario: El administrador de club modifica el rol de un usuario activo
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe el usuario con email "jugador.uno@test.com"
    Cuando en la tabla de miembros selecciona el nuevo rol "COACH_ANALYST" para "jugador.uno@test.com" y presiona "Guardar rol"
    Entonces el sistema muestra el mensaje "Rol actualizado correctamente"
    Y la tabla de miembros muestra al usuario "jugador.uno@test.com" con el rol "COACH_ANALYST"

  Escenario: El administrador de club da de baja la cuenta de un usuario
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe el usuario con email "jugador.tres@test.com"
    Cuando solicita dar de baja al usuario con email "jugador.tres@test.com"
    Entonces el sistema confirma la baja del usuario correctamente
    Y el usuario con email "jugador.tres@test.com" figura como inactivo en el sistema

  Escenario: Un usuario dado de baja no puede iniciar sesión
    Dado que el usuario con email "jugador.tres@test.com" ha sido dado de baja previamente por el administrador
    Cuando el usuario con email "jugador.tres@test.com" y contraseña "PassSegura123!" intenta iniciar sesión
    Entonces el sistema rechaza la solicitud con código 403 y el mensaje "El usuario se encuentra dado de baja"

  Escenario: Un usuario dado de baja conserva su historial de datos e identidad intactos
    Dado que el usuario con email "jugador.tres@test.com" ha sido dado de baja previamente por el administrador
    Entonces la persona asociada al usuario con email "jugador.tres@test.com" y sus registros de eventos y divisiones permanecen en la base de datos

  Escenario: El administrador de club no puede darse de baja a sí mismo
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe el usuario con email "admin@club.com"
    Cuando solicita dar de baja al usuario con email "admin@club.com"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "No puede darse de baja mientras sea el administrador designado de un club"

  Escenario: Intentar dar de baja a un usuario que ya está inactivo
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que el usuario con email "jugador.tres@test.com" ha sido dado de baja previamente por el administrador
    Cuando solicita dar de baja al usuario con email "jugador.tres@test.com"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "El usuario ya se encuentra dado de baja"

  Escenario: No se puede modificar el rol de un usuario dado de baja
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe el usuario con email "jugador.tres@test.com"
    Y que el usuario con email "jugador.tres@test.com" ha sido dado de baja previamente por el administrador
    Cuando en la tabla de miembros selecciona el nuevo rol "COACH_ANALYST" para "jugador.tres@test.com" y presiona "Guardar rol"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "No se puede modificar el rol de un usuario dado de baja"

  Escenario: El administrador de club no puede dar de baja a otro administrador
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe el usuario con email "jugador.dos@test.com"
    Y que el usuario "jugador.dos@test.com" tiene el rol de administrador de club
    Cuando solicita dar de baja al usuario con email "jugador.dos@test.com"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "No tiene permisos para dar de baja a otro administrador"

  Escenario: Un usuario sin rol de administrador no puede dar de baja a otros usuarios
    Dado que el usuario con rol jugador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el usuario con email "otro.jugador@test.com"
    Cuando intenta enviar la solicitud de baja para el usuario "otro.jugador@test.com"
    Entonces el sistema rechaza la solicitud con código 403 y el mensaje "Acceso denegado: solo el administrador del club puede realizar esta acción"

  Escenario: Intentar dar de baja un usuario inexistente
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando solicita dar de baja al usuario inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con código 404 y el mensaje "Usuario no encontrado"
