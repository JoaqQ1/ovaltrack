# language: es
Característica: Contexto de usuario autenticado y miembros del club
  Como usuario autenticado de la plataforma
  Quiero consultar mi contexto de sesión y los miembros de mi club
  Para visualizar mi información personal y gestionar la plantilla de mi club

  Escenario: Consultar el contexto de sesión del usuario autenticado
    Dado que el usuario con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando solicita su información de contexto de usuario autenticado
    Entonces el sistema responde con el contexto del usuario incluyendo sus datos de usuario y club asignado

  Escenario: Consultar miembros del club al que pertenece el usuario autenticado
    Dado que el usuario con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la lista de miembros de su club
    Entonces el sistema responde con la lista de miembros pertenecientes al club

  Escenario: Consultar contexto sin sesión iniciada
    Dado un usuario sin sesión iniciada en la plataforma
    Cuando intenta solicitar su información de contexto de usuario
    Entonces el sistema rechaza la acción solicitando autenticación
