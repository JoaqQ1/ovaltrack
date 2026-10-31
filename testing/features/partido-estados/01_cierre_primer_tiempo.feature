# language: es
Característica: Cierre del primer tiempo y transición al segundo tiempo
  Como entrenador o analista
  Quiero cerrar el primer tiempo de un partido en curso
  Para registrar el entretiempo, congelar los eventos del período jugado y preparar el inicio del segundo tiempo

  Escenario: Cierre exitoso del primer tiempo conservando los eventos registrados
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Bigornia Club"
    Y que se han registrado los siguientes eventos en el primer tiempo:
      | tipo_evento            | posesion | tiempo_segundos | periodo | atributos          |
      | Try                    | OWN      | 300             | 1       | zone=left          |
      | Tackle completado      | OPPONENT | 600             | 1       |                    |
      | Kick H (Penal a palos) | OWN      | 1200            | 1       | wasSuccessful=true |
    Cuando el entrenador solicita cerrar el primer tiempo del partido
    Entonces el sistema responde con 200 y devuelve el partido con estado "HALFTIME" y periodo 1
    Y el partido cuenta con 3 eventos registrados para el periodo 1

  Escenario: Inicio exitoso del segundo tiempo tras el entretiempo
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el partido contra "Calafate Rugby Club" se encuentra en estado de entretiempo
    Cuando el entrenador solicita iniciar el segundo tiempo del partido
    Entonces el sistema responde con 200 y devuelve el partido con estado "IN_PROGRESS" y periodo 2

  Escenario: Rechazo al intentar cerrar el primer tiempo por segunda vez
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que el partido contra "Chenque Rugby Club" se encuentra en el segundo tiempo
    Cuando el entrenador solicita cerrar el primer tiempo del partido
    Entonces el sistema responde con 409 y "El primer tiempo ya ha sido cerrado"

  Escenario: Rechazo al intentar cerrar el primer tiempo por un usuario de otro club
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Deportivo Portugués"
    Cuando el administrador del club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" intenta cerrar el primer tiempo del partido
    Entonces el sistema responde con 403 y "Acceso denegado: solo el entrenador asignado o el administrador del club pueden gestionar este partido"

  Escenario: Error al intentar cerrar el primer tiempo de un partido inexistente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando solicita cerrar el primer tiempo para un partido inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "Partido no encontrado"
