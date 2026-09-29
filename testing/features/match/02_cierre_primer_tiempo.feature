# language: es
Característica: Cierre del primer tiempo y transición al segundo tiempo
  Como entrenador o analista
  Quiero cerrar el primer tiempo de un partido en curso
  Para registrar el entretiempo, congelar los eventos del período jugado y preparar el inicio del segundo tiempo

  Escenario: Cierre exitoso del primer tiempo conservando los eventos registrados
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Comodoro Rugby Club"
    Y que se han registrado los siguientes eventos en el primer tiempo:
      | tipo_evento       | posesion | tiempo_segundos | periodo |
      | Try               | OWN      | 300             | 1       |
      | Tackle completado | OPPONENT | 600             | 1       |
      | Penal a los palos | OWN      | 1200            | 1       |
    Cuando el entrenador solicita cerrar el primer tiempo del partido
    Entonces el sistema responde con código 200 y devuelve el partido con estado "HALFTIME" y periodo 1
    Y el partido cuenta con 3 eventos registrados para el periodo 1

  Escenario: Inicio exitoso del segundo tiempo tras el entretiempo
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el partido contra "Comodoro Rugby Club" se encuentra en estado de entretiempo
    Cuando el entrenador solicita iniciar el segundo tiempo del partido
    Entonces el sistema responde con código 200 y devuelve el partido con estado "IN_PROGRESS" y periodo 2
    Cuando el entrenador registra el evento "Try" para el equipo propio en el minuto 45 del periodo 2
    Entonces el partido cuenta con 1 eventos registrados para el periodo 2
    Y el partido cuenta con 3 eventos registrados para el periodo 1

  Escenario: Rechazo al intentar cerrar el primer tiempo de un partido que no está en curso
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Puerto Madryn RC"
    Cuando el entrenador solicita cerrar el primer tiempo de ese partido programado
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "El partido no se encuentra en curso en el primer tiempo"

  Escenario: Rechazo al intentar cerrar el primer tiempo por segunda vez
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el partido contra "Comodoro Rugby Club" se encuentra en el segundo tiempo
    Cuando el entrenador solicita cerrar el primer tiempo del partido
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "El primer tiempo ya ha sido cerrado"

  Escenario: Rechazo al intentar cerrar el primer tiempo por un usuario no autorizado
    Dado que el usuario con rol jugador con email "usuario.norole@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Comodoro Rugby Club"
    Cuando el usuario intenta solicitar el cierre del primer tiempo del partido
    Entonces el sistema rechaza la solicitud con código 403 y el mensaje "Acceso denegado: solo el entrenador asignado o el administrador del club pueden gestionar este partido"

  Escenario: Error al intentar cerrar el primer tiempo de un partido inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando solicita cerrar el primer tiempo para un partido inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con código 404 y el mensaje "Partido no encontrado"
