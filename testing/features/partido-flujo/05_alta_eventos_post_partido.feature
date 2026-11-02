# language: es
@hu-8.4
Característica: Alta de eventos no cargados en vivo post-partido (HU 8.4)
  Como entrenador o analista
  Quiero agregar eventos que no llegué a cargar durante el partido
  Para que las estadísticas y la línea cronológica reflejen lo que realmente pasó

  # --- HAPPY PATHS ---

  Escenario: Alta exitosa de un evento con jugador en un partido cerrado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador agrega post-partido el evento "Try" con atributos "zone=left" para el equipo propio con el jugador "Blue Album" en el minuto 15 del periodo 1
    Entonces el sistema responde con 200
    Y la línea de eventos refleja el nuevo evento "Try" en el periodo 1 asignado a "Blue Album"
    Y el evento agregado se identifica con origen post-partido

  Escenario: Alta exitosa de un evento sin jugador asignado en un partido cerrado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Comodoro Rugby Club"
    Cuando el entrenador agrega post-partido el evento "Tackle completado" con atributos "" para el equipo propio en el minuto 20 del periodo 1
    Entonces el sistema responde con 200
    Y la línea de eventos refleja el nuevo evento "Tackle completado" sin jugador asignado
    Y el evento agregado se identifica con origen post-partido

  Escenario: Integración de evento agregado al cálculo del tanteador y estadísticas
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Calafate Rugby Club"
    Y el tanteador propio del partido es 0
    Cuando el entrenador agrega post-partido el evento "Try" con atributos "zone=center" para el equipo propio con el jugador "Blue Album" en el minuto 10 del periodo 1
    Entonces el sistema responde con 200
    Y el tanteador propio del partido es 5

  Escenario: Distinción entre eventos cargados en vivo y eventos agregados post-partido
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Patoruzú Rugby Club" con eventos cargados en vivo
    Cuando el entrenador agrega post-partido el evento "Kick H (Penal a palos)" con atributos "wasSuccessful=true" para el equipo propio en el minuto 30 del periodo 1
    Y el entrenador consulta la línea de eventos del partido cerrado
    Entonces se distingue claramente el evento cargado en vivo del evento agregado post-partido

  # --- SAD PATHS ---

  Escenario: Error al intentar agregar un evento post-partido con un jugador que no existe
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador intenta agregar post-partido el evento "Try" con un jugador fuera del plantel
    Entonces el sistema responde con 409 y "No se puede asignar un evento a un jugador que no existe"

  Escenario: Error al intentar agregar un evento post-partido con un tipo de evento inválido
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Cuando el entrenador intenta agregar post-partido un evento con un ID de tipo de evento inválido
    Entonces el sistema responde con 409 y "No se puede crear un nuevo evento a partir de un tipo de evento que no existe"

  Escenario: Error de seguridad al intentar agregar un evento post-partido en un partido de otro club
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Bigornia Club"
    Cuando el administrador del club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" intenta agregar un evento post-partido a ese partido
    Entonces el sistema responde con 403 y "Acceso denegado: solo el entrenador asignado o el administrador del club pueden gestionar este partido"
