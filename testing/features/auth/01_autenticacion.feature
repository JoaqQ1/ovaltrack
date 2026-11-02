# language: es
Característica: Autenticación de usuarios
  Como usuario de OvalTrack
  Quiero iniciar sesión con mis credenciales y consultar mi sesión
  Para acceder a las funcionalidades que corresponden a mi rol

  # --- INICIO DE SESIÓN ---

  Esquema del escenario: Un usuario activo inicia sesión con sus credenciales
    Cuando el usuario con email "<email>" y contraseña "PassSegura123!" intenta iniciar sesión
    Entonces el sistema responde con 200
    Y la respuesta incluye un token de sesión

    Ejemplos:
      | email                 |
      | admin_puerto@test.com |
      | felipe.conte@test.com |
      | jugador.uno@test.com  |

  Esquema del escenario: El inicio de sesión con credenciales incorrectas es rechazado sin revelar cuál dato falló
    Cuando el usuario con email "<email>" y contraseña "<contrasenia>" intenta iniciar sesión
    Entonces el sistema responde con 400 y "Credencial inválida"
    Y la respuesta no incluye un token de sesión

    Ejemplos:
      | email                 | contrasenia      |
      | felipe.conte@test.com | OtraClave123!    |
      | nadie@test.com        | PassSegura123!   |

  Escenario: Una cuenta pendiente de aprobación no puede iniciar sesión
    Cuando el usuario con email "admin@test_no_active.com" y contraseña "PassSegura123!" intenta iniciar sesión
    Entonces el sistema responde con 403 y "La cuenta todavia se encuentra inactiva."
    Y la respuesta no incluye un token de sesión

  # --- RECUPERACIÓN DE CONTRASEÑA ---

  Escenario: Un usuario solicita la recuperación de su contraseña
    Cuando solicita recuperar la contraseña de la cuenta "felipe.conte@test.com"
    Entonces el sistema responde con 202 y "Solicitud enviada correctamente"
    Y la respuesta no incluye un token de sesión

  # --- SESIÓN ACTUAL ---

  Escenario: Un usuario autenticado consulta los datos de su sesión
    Dado que el usuario con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los datos de su sesión
    Entonces el sistema devuelve la sesión de "felipe.conte@test.com" con el rol "COACH_ANALYST" en el club "PMRC"

  Escenario: Una consulta de sesión sin autenticación es rechazada
    Dado un usuario sin sesión iniciada en la plataforma
    Cuando consulta los datos de su sesión
    Entonces el sistema responde con 401 y "No autorizado: se requiere autenticación"

  Escenario: Una consulta de sesión con un token inválido es rechazada
    Dado un usuario con un token de sesión inválido
    Cuando consulta los datos de su sesión
    Entonces el sistema responde con 401 y "No autorizado: se requiere autenticación"
