# language: es
Característica: Consulta y edición de partidos
  Como entrenador o analista de una división
  Quiero consultar y corregir los partidos programados
  Para mantener el calendario actualizado

  Escenario: Consulta de un partido por su ID
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido contra "Deportivo Portugués" para el "2027-08-07T15:30:00" en la division "Primera"
    Cuando consulta el partido
    Entonces el sistema responde con 200 y devuelve el partido en estado "EMPTY_ROSTER" contra el rival "Deportivo Portugués"

  Escenario: Los partidos del club incluyen el partido programado
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido contra "Deportivo Portugués" para el "2027-08-07T15:30:00" en la division "Primera"
    Cuando consulta los partidos del club
    Entonces el sistema responde con 200
    Y el listado incluye el partido contra "Deportivo Portugués" para el "2027-08-07T15:30:00"

  Escenario: El entrenador corrige la fecha y el rival de un partido
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido contra "Deportivo Portugués" para el "2027-08-07T15:30:00" en la division "Primera"
    Cuando edita el partido con la fecha "2027-08-14T16:00:00" y el rival "Chenque Rugby Club"
    Entonces el sistema responde con 200 y devuelve el partido en estado "EMPTY_ROSTER" contra el rival "Chenque Rugby Club"
    Y el partido queda programado para el "2027-08-14T16:00:00"

  Escenario: No se puede editar un partido con un rival inexistente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido contra "Chenque Rugby Club" para el "2027-08-14T16:00:00" en la division "Primera"
    Cuando intenta editar el partido con un rival inexistente
    Entonces el sistema responde con 404 y "Oponente no encontrado"

  Escenario: No se puede editar un partido inexistente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta editar un partido inexistente
    Entonces el sistema responde con 404 y "Partido no encontrado"
