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

  Escenario: Rechazar registro de jugador con un email de contacto duplicado
    Dado que el administrador de club con email "admin@club.com" y contraseña "administrador" ha iniciado sesión
    Y que existe una división en el club
    Y que ya existe una persona registrada con email "bautista.delguy@test.com"
    Cuando registra un nuevo jugador con la siguiente información:
      | nombre   | apellido | camiseta | posicion | email                    |
      | Bautista | Delguy   | 14       | Wing     | bautista.delguy@test.com |
    Entonces el sistema rechaza el registro con el mensaje de conflicto "Email ya registrado"

  Escenario: Un entrenador asignado a una división registra exitosamente a un jugador en su división
    Dado que el usuario con rol entrenador con email "entrenador.asignado@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el entrenador está asignado a una división activa del club
    Cuando registra un nuevo jugador en su división asignada con los siguientes datos:
      | nombre  | apellido | camiseta | posicion | email                  |
      | Rodrigo | Bruni    | 8        | Octavo   | rodrigo.bruni@test.com |
    Entonces el sistema crea la persona y la asocia exitosamente a la división como jugador

  Escenario: Un entrenador no asignado a una división intenta registrar un jugador y es rechazado
    Dado que el usuario con rol entrenador con email "entrenador.noasignado@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe una división en el club a la que el entrenador no está asignado
    Cuando intenta registrar un jugador en dicha división con los siguientes datos:
      | nombre | apellido | camiseta | posicion | email                |
      | Juan   | Imhoff   | 11       | Wing     | juan.imhoff@test.com |
    Entonces el sistema rechaza la acción con el mensaje "Acceso denegado: solo un entrenador asignado a esta división puede realizar esta acción"

  Escenario: Un usuario con rol jugador no puede registrar jugadores en una división
    Dado que el usuario con rol jugador con email "jugador.tres@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe una división en el club
    Cuando intenta registrar un jugador en dicha división con los siguientes datos:
      | nombre | apellido | camiseta | posicion | email                |
      | Juan   | Imhoff   | 11       | Wing     | juan.imhoff@test.com |
    Entonces el sistema rechaza la acción con el mensaje "Acceso denegado: solo el administrador del club puede realizar esta acción"

  Escenario: Un usuario no autenticado no puede registrar jugadores en una división
    Dado un usuario sin sesión iniciada en la plataforma
    Y que existe una división en el club
    Cuando intenta registrar un jugador en dicha división con los siguientes datos:
      | nombre | apellido | camiseta | posicion | email                |
      | Juan   | Imhoff   | 11       | Wing     | juan.imhoff@test.com |
    Entonces el sistema rechaza la acción solicitando autenticación
