# language: es
Característica: Modificación de rol y baja de cuentas de usuario
  Como administrador de club
  Quiero modificar o revocar el rol y el acceso de las cuentas de mi club
  Para mantener los accesos actualizados sin eliminar el historial de datos asociados

  # --- MODIFICACIÓN DE ROL ---

  Escenario: El administrador de club cambia el rol de una cuenta
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando cambia el rol de "jugador.dos@test.com" a "COACH_ANALYST"
    Entonces el sistema responde con 200
    Y la cuenta "jugador.dos@test.com" figura en el club con el rol "COACH_ANALYST" y acceso "activo"

  Esquema del escenario: El administrador de club no puede asignar roles fuera de las reglas del club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando cambia el rol de "<email>" a "<nuevoRol>"
    Entonces el sistema responde con 409 y "<mensaje>"
    Y la cuenta "<email>" figura en el club con el rol "PLAYER" y acceso "activo"

    Ejemplos:
      | email                 | nuevoRol        | mensaje                                                                                    |
      | jugador.tres@test.com | ADMIN_CLUB      | El club ya cuenta con un administrador activo. Solo puede haber un administrador por club. |
      | jugador.tres@test.com | ADMIN_OVALTRACK | El administrador de club no puede asignar el rol ADMIN_OVALTRACK                           |

  Escenario: El administrador de club intenta cambiar el rol de una cuenta inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando cambia el rol del usuario inexistente con ID "00000000-0000-0000-0000-000000000000" a "COACH_ANALYST"
    Entonces el sistema responde con 404 y "Usuario no encontrado"

  Escenario: Un jugador no puede modificar roles
    Dado que el jugador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando cambia el rol de "jugador.tres@test.com" a "COACH_ANALYST"
    Entonces el sistema responde con 403 y "Acceso denegado: solo el administrador del club puede realizar esta acción"

  Escenario: Un usuario sin sesión no puede modificar roles
    Dado un usuario sin sesión iniciada en la plataforma
    Cuando cambia el rol de "jugador.tres@test.com" a "COACH_ANALYST"
    Entonces el sistema responde con 401 y "No autorizado: se requiere autenticación"

  # --- REVOCACIÓN DE ROL Y ACCESO ---

  Escenario: El administrador de club revoca el rol y el acceso de una cuenta
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando revoca el rol y el acceso de "otro.jugador@test.com"
    Entonces el sistema responde con 200
    Y la cuenta "otro.jugador@test.com" figura en el club con el rol "NO_ROLE" y acceso "inactivo"

  Escenario: Una cuenta con el rol y el acceso revocados no puede ingresar a la aplicación
    Dado que la cuenta "otro.jugador@test.com" fue dada de baja
    Cuando el usuario con email "otro.jugador@test.com" y contraseña "PassSegura123!" intenta iniciar sesión
    Entonces el sistema responde con 403 y "La cuenta todavia se encuentra inactiva."

  Escenario: El administrador de club no puede revocar su propio acceso
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando da de baja la cuenta "admin_puerto@test.com"
    Entonces el sistema responde con 409 y "No puede darse de baja mientras sea el administrador designado de un club"

  Escenario: El administrador de club intenta revocar el acceso de una cuenta inactiva
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que la cuenta "otro.jugador@test.com" fue dada de baja
    Cuando da de baja la cuenta "otro.jugador@test.com"
    Entonces el sistema responde con 409 y "El usuario ya se encuentra dado de baja"

  Escenario: No se puede modificar el rol de una cuenta dada de baja
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que la cuenta "otro.jugador@test.com" fue dada de baja
    Cuando cambia el rol de "otro.jugador@test.com" a "PLAYER"
    Entonces el sistema responde con 409 y "No se puede modificar el rol de un usuario dado de baja"

  Escenario: El administrador de club intenta dar de baja una cuenta inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando da de baja al usuario inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "Usuario no encontrado"
