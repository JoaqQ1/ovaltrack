# language: es
Característica: Gestión de roles restringido a administrador de club
  Como administrador de club
  Quiero cambiar los roles de los usuarios desde la tabla de gestión de miembros
  Para asignar las responsabilidades correspondientes en el club

  Esquema del escenario: El administrador de club modifica el rol de un usuario desde la tabla
    Dado que el administrador de club con email "admin.club@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el usuario con email "<emailUsuario>"
    Cuando en la tabla de miembros selecciona el nuevo rol "<nuevoRol>" para "<emailUsuario>" y presiona "Guardar rol"
    Entonces el sistema muestra el mensaje "<mensajeEsperado>"
    Y la tabla de miembros muestra al usuario "<emailUsuario>" con el rol "<rolFinal>"

    Ejemplos:
      | emailUsuario            | nuevoRol        | mensajeEsperado                                                  | rolFinal      |
      | jugador.uno@test.com    | COACH_ANALYST   | Rol actualizado correctamente                                    | COACH_ANALYST |
      | jugador.dos@test.com    | ADMIN_CLUB      | Rol actualizado correctamente                                    | ADMIN_CLUB    |
      | usuario.norole@test.com | PLAYER          | Rol actualizado correctamente                                    | PLAYER        |
      | jugador.tres@test.com   | ADMIN_OVALTRACK | El administrador de club no puede asignar el rol ADMIN_OVALTRACK | PLAYER        |

  Escenario: Modificación múltiple de roles desde la tabla
    Dado que el administrador de club con email "admin.club@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el usuario con email "otro.jugador@test.com"
    Cuando modifica los roles en la tabla según los siguientes cambios y presiona "Guardar cambios":
      | emailUsuario          | nuevoRol      | mensajeEsperado               |
      | otro.jugador@test.com | COACH_ANALYST | Rol actualizado correctamente |
    Entonces la tabla de miembros refleja todos los cambios realizados

  Escenario: Un usuario jugador no puede modificar roles en el sistema
    Dado que el usuario con rol jugador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el usuario con email "jugador.dos@test.com"
    Cuando presiona el botón para cambiar el rol de "jugador.dos@test.com" a "COACH_ANALYST"
    Entonces el sistema rechaza la acción con el mensaje "Acceso denegado: solo el administrador del club puede realizar esta acción"

  Escenario: Un usuario no autenticado no puede modificar roles
    Dado un usuario sin sesión iniciada en la plataforma
    Y que existe el usuario con email "jugador.dos@test.com"
    Cuando intenta enviar la solicitud para cambiar el rol de "jugador.dos@test.com" a "COACH_ANALYST"
    Entonces el sistema rechaza la acción solicitando autenticación

  Escenario: Intentar modificar el rol de un usuario inexistente
    Dado que el administrador de club con email "admin.club@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando presiona el botón para cambiar el rol del usuario inexistente con ID "00000000-0000-0000-0000-000000000000" a "COACH_ANALYST"
    Entonces el sistema muestra el mensaje de error "Usuario no encontrado"
