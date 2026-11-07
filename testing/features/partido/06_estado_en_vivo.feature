# language: es
Característica: Estado en vivo de un partido
  Como entrenador o analista de una división
  Quiero guardar y recuperar el reloj y la posesión del partido
  Para retomar la captura en vivo desde otro dispositivo sin perder el estado

  Escenario: El último estado en vivo guardado es el que se recupera
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Cuando guarda el estado en vivo con 125 segundos transcurridos, reloj "en marcha" y posesión "OWN"
    Y guarda el estado en vivo con 310 segundos transcurridos, reloj "pausado" y posesión "OPPONENT"
    Entonces el estado en vivo del partido es de 310 segundos con el reloj "pausado" y posesión "OPPONENT"

  Escenario: El arranque de la captura en vivo trae el partido, sus eventos y el catálogo
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido programado para la división "Primera" contra "Chenque Rugby Club"
    Y que el partido está en curso
    Y que se registró el evento "Tackle completado" en el partido
    Cuando consulta el arranque de la captura en vivo
    Entonces el sistema responde con 200
    Y el arranque incluye el partido en curso, 1 evento y el catálogo de tipos de evento

  Escenario: No se puede consultar el estado en vivo de un partido inexistente
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta consultar el estado en vivo de un partido inexistente
    Entonces el sistema responde con 404 y "Partido no encontrado"
