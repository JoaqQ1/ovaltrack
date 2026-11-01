# language: es
Característica: Consulta del catálogo de tipos de evento y de los eventos registrados
  Como entrenador o analista
  Quiero consultar los tipos de evento disponibles y los eventos registrados por club y división
  Para analizar lo ocurrido en los partidos de mi equipo

  # --- CATÁLOGO DE TIPOS DE EVENTO ---

  Escenario: Consulta del catálogo completo de tipos de evento
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el catálogo de tipos de evento
    Entonces el sistema responde con 200
    Y el catálogo incluye los siguientes tipos de evento:
      | nombre            | puntos |
      | Try               | 5      |
      | Conversión        | 2      |
      | Tackle completado | 0      |
      | Scrum             | 0      |
      | Line-out          | 0      |

  Escenario: Consulta de un tipo de evento por su ID
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el tipo de evento "Try"
    Entonces el sistema responde con 200
    Y el tipo de evento devuelto es "Try" con código "TRY" y suma 5 puntos

  Escenario: Consulta de un tipo de evento inexistente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el tipo de evento inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "Tipo de evento no encontrado"

  # --- EVENTOS POR CLUB Y DIVISIÓN ---

  Escenario: Consulta de los eventos registrados en los partidos del club
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los eventos del club "PMRC"
    Entonces el sistema responde con 200
    Y la lista incluye los eventos del partido contra "Comodoro Rugby Club" en la division "Primera"
    Y todos los eventos pertenecen a partidos de la division "Primera"

  Escenario: Consulta de los eventos registrados en los partidos de una división
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta los eventos de la division "Primera"
    Entonces el sistema responde con 200
    Y la lista incluye los eventos del partido contra "Comodoro Rugby Club" en la division "Primera"
    Y todos los eventos pertenecen a partidos de la division "Primera"
