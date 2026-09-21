# language: es
Característica: Contexto de usuario autenticado, miembros del club y creación atómica de jugador
  Como usuario autenticado de la plataforma
  Quiero consultar mi contexto de sesión, los miembros de mi club y fichar nuevos jugadores creando su información personal
  Para gestionar eficientemente las plantillas de las divisiones

  Escenario: Consultar el contexto de sesión del usuario autenticado
    Dado que el usuario con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando solicita su información de contexto de usuario autenticado
    Entonces el sistema responde con el contexto del usuario incluyendo sus datos de usuario y club asignado

  Escenario: Consultar miembros del club al que pertenece el usuario autenticado
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Cuando consulta la lista de miembros de su club
    Entonces el sistema responde con la lista de miembros pertenecientes al club

  Escenario: Crear persona y registrarla directamente como jugador en una división en una sola operación
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe una división en el club
    Cuando registra un nuevo jugador con la siguiente información:
      | nombre   | apellido | camiseta | posicion |
      | Bautista | Delguy   | 14       | Wing     |
    Entonces el sistema crea la persona y la asocia exitosamente a la división como jugador
