
Escenario: Un usuario con rol jugador no puede crear divisiones
Dado que el usuario con rol jugador con email "usuario.norole@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta enviar la solicitud para crear la división "Juveniles" con categoría "U18" y género "MALE"
Entonces el sistema rechaza la solicitud con código 403 y el mensaje "Acceso denegado: solo el administrador del club puede realizar esta acción"

Escenario: Un usuario con rol entrenador no puede crear divisiones
Dado que el usuario con rol entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta enviar la solicitud para crear la división "M15" con categoría "U15" y género "MALE"
Entonces el sistema rechaza la solicitud con código 403 y el mensaje "Acceso denegado: solo el administrador del club puede realizar esta acción"