# language: es
Característica: Registro y autenticación de usuarios

  Escenario: Un usuario registrado puede iniciar sesión con su contraseña
    Cuando registro un usuario con una contraseña segura
    Entonces el registro debe responder con el código 201
    Y la respuesta de registro debe incluir un token
    Cuando inicio sesión con la contraseña registrada
    Entonces el login debe responder con el código 200
    Y la respuesta de login debe incluir un token

  Escenario: Un usuario puede solicitar la recuperación de su contraseña
    Cuando registro un usuario con una contraseña segura
    Entonces el registro debe responder con el código 201
    Cuando solicito la recuperación de contraseña para el usuario registrado
    Entonces la solicitud de recuperación debe responder con el código 202
    Y la respuesta de recuperación no debe incluir un token