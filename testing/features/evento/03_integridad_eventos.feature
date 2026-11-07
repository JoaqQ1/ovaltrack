# language: es
Característica: Integridad de los eventos registrados en vivo
  Como entrenador o analista
  Quiero que los eventos respeten las reglas del partido y no se pierdan ni se dupliquen
  Para confiar en el tanteador y en las estadísticas aunque la captura se reenvíe

  # --- CONSULTA ---

  Escenario: Consulta de los eventos de un partido
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Y que se registró el evento "Tackle completado" en el partido
    Cuando consulta los eventos del partido
    Entonces el sistema responde con 200
    Y el partido tiene 1 evento registrado

  Escenario: Consulta de los eventos de un partido inexistente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los eventos de un partido inexistente
    Entonces el sistema responde con 409 y "Partido no encontrado"

  Escenario: Consulta de un evento por su ID
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Y que se registró el evento "Tackle completado" en el partido
    Cuando consulta el evento registrado
    Entonces el sistema responde con 200
    Y el evento devuelto es de tipo "Tackle completado"

  # --- IDEMPOTENCIA DE LA CAPTURA OFFLINE ---

  Escenario: Reenviar el mismo evento no lo duplica
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Cuando registra dos veces el evento "Tackle completado" con el mismo identificador de cliente
    Entonces ambos envíos devuelven el mismo evento
    Y el partido tiene 1 evento registrado

  # --- REGLAS DE POSESIÓN, JUGADOR Y TIEMPO ---

  Escenario: Un evento del rival no puede asignarse a un jugador del plantel
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Cuando intenta registrar el evento "Tackle completado" del rival asignado a un jugador del plantel
    Entonces el sistema responde con 409 y "No se puede asignar un jugador a un evento del equipo rival"

  Escenario: Un evento no puede asignarse a un jugador que no integra el plantel
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Cuando intenta registrar el evento "Tackle completado" con el jugador "jugador.temporal@test.com" que no integra el plantel
    Entonces el sistema responde con 409 y "No se puede asignar un evento a un jugador que no pertenece al plantel del partido"

  Esquema del escenario: El tiempo de juego del evento debe estar dentro del reglamento
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Cuando intenta registrar un evento "Tackle completado" con <segundos> segundos de juego en el periodo <periodo>
    Entonces el sistema responde con 409 y "<mensaje>"

    Ejemplos:
      | segundos | periodo | mensaje                                                          |
      | -1       | 1       | El tiempo de juego no puede ser negativo                         |
      | 2401     | 1       | El tiempo de juego del 1° Tiempo no puede exceder los 40 minutos |
      | 4801     | 2       | El tiempo de juego del 2° Tiempo no puede exceder los 80 minutos |

  # --- MARCADOR EN VIVO ---

  Esquema del escenario: Los eventos que puntúan actualizan el marcador del partido
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Cuando registra en el partido el evento "<evento>" con atributos "<atributos>" y posesión "<posesion>" en el minuto 10 del periodo 1
    Entonces el sistema responde con 200
    Y el marcador del partido es <local> a <visitante>

    Ejemplos:
      | evento                 | atributos           | posesion | local | visitante |
      | Try                    | zone=center         | OWN      | 5     | 0         |
      | Conversión             | wasSuccessful=true  | OWN      | 2     | 0         |
      | Conversión             | wasSuccessful=false | OWN      | 0     | 0         |
      | Kick H (Penal a palos) | wasSuccessful=true  | OWN      | 3     | 0         |
      | Drop goal              | wasSuccessful=true  | OWN      | 3     | 0         |
      | Try                    | zone=center         | OPPONENT | 0     | 5         |
