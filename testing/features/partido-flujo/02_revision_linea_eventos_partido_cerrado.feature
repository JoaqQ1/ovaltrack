# language: es
Característica: Revisión de la línea de eventos de un partido cerrado
  Como entrenador o analista
  Quiero revisar la línea completa de eventos de un partido ya sincronizado
  Para verificar que todo lo cargado sea correcto

  Escenario: Consulta exitosa de la lista completa y ordenada de eventos de un partido cerrado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento            | posesion | tiempo_segundos | periodo | atributos          |
      | Try                    | OWN      | 300             | 1       | zone=left          |
      | Tackle completado      | OPPONENT | 600             | 1       |                    |
      | Kick H (Penal a palos) | OWN      | 1200            | 1       | wasSuccessful=true |
      | Try                    | OWN      | 2700            | 2       | zone=right         |
    Cuando el entrenador consulta la línea de eventos del partido cerrado
    Entonces el sistema responde con 200 y devuelve la lista completa de 4 eventos ordenados cronológicamente
    Y cada evento contiene tipo, tiempo de juego y marca de tiempo real

  Escenario: Identificación de eventos sin jugador asignado en un partido cerrado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Comodoro Rugby Club"
    Y que se han registrado eventos con y sin jugador asignado para el partido
    Cuando el entrenador consulta la línea de eventos del partido cerrado
    Entonces el sistema responde con 200
    Y se identifican claramente los eventos que no tienen jugador asignado

  Escenario: Error al intentar consultar la línea de eventos post-partido de un partido que no está cerrado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Deportivo Portugués"
    Cuando el entrenador consulta la línea de eventos del partido cerrado
    Entonces el sistema responde con 409 y "El partido aún no se encuentra cerrado"
