# language: es
Característica: Gestión de usuarios
  Como administrador de club
  Quiero registrar, consultar y eliminar cuentas de usuario
  Para administrar quiénes pueden ingresar a la plataforma

  Escenario: El administrador de club registra una cuenta de usuario
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando registra la cuenta "usuario.temporal@test.com" con rol "PLAYER" para "Usuario" "Temporal"
    Entonces el sistema responde con 200
    Y la cuenta "usuario.temporal@test.com" puede consultarse por su ID con el rol "PLAYER"

  Escenario: Consulta del listado de usuarios
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el listado de usuarios
    Entonces el sistema responde con 200
    Y el listado de usuarios incluye las cuentas "usuario.temporal@test.com" y "felipe.conte@test.com"

  Esquema del escenario: No se puede registrar una cuenta con datos inválidos
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando registra la cuenta "<email>" con rol "<rol>" para "Usuario" "Invalido"
    Entonces el sistema responde con 409 y "<mensaje>"

    Ejemplos:
      | email                 | rol             | mensaje                                                             |
      | felipe.conte@test.com | PLAYER          | El email ya se encuentra registrado                                 |
      | admin.oval@test.com   | ADMIN_OVALTRACK | ADMIN_OVALTRACK solo puede crearse mediante el bootstrap controlado |
      | email-invalido        | PLAYER          | El formato de email es inválido                                     |

  Escenario: Consulta de una cuenta inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la cuenta inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "Usuario no encontrado"

  Escenario: El administrador de club elimina una cuenta de usuario
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando elimina la cuenta "usuario.temporal@test.com"
    Entonces el sistema responde con 200 y "Usuario eliminado correctamente"
    Y la cuenta eliminada ya no puede consultarse
