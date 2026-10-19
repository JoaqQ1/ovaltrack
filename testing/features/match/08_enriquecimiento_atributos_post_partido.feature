# language: es
Característica: Enriquecimiento táctico de atributos en post-partido (HU 8.5)
  Como entrenador o analista
  Quiero registrar y editar atributos tácticos de las jugadas en el post-partido
  Para tener un análisis detallado y preciso de la disciplina, formaciones fijas y juego general

  # --- HAPPY PATHS ---

  Escenario: Enriquecimiento de atributos tácticos para diversos tipos de jugadas
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento                 | posesion | tiempo_segundos | periodo |
      | Penal / Infracción cometida | OPPONENT | 300             | 1       |
      | Tarjeta Amarilla            | OPPONENT | 600             | 1       |
      | Scrum                       | OWN      | 900             | 1       |
      | Acarreo (Carry)             | OWN      | 1200            | 1       |
      | Pase / Offload              | OWN      | 1500            | 1       |
    Cuando el entrenador enriquece los eventos del partido con los siguientes atributos:
      | tipo_evento                 | atributo_clave  | atributo_valor |
      | Penal / Infracción cometida | penaltyType     | OFFSIDE        |
      | Tarjeta Amarilla            | reason          | FOUL_PLAY      |
      | Tarjeta Amarilla            | durationMinutes | 10             |
      | Scrum                       | scrumResult     | WON_CLEAN      |
      | Acarreo (Carry)             | metersGained    | 8              |
      | Acarreo (Carry)             | defendersBeaten | 2              |
      | Pase / Offload              | passType        | OFFLOAD        |
    Entonces el sistema responde con código 200 en todas las modificaciones de atributos
    Y al consultar la línea de tiempo del partido post-match, cada evento contiene sus atributos tácticos persistidos

  Escenario: Reseteo automático de atributos al cambiar de tipo de evento
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Calafate RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento                 | posesion | tiempo_segundos | periodo |
      | Penal / Infracción cometida | OWN      | 450             | 1       |
    Y que el evento "Penal / Infracción cometida" tiene el atributo "penaltyType" con valor "OFFSIDE"
    Cuando el entrenador cambia el tipo del evento a "Try" sin especificar atributos
    Entonces el sistema responde con código 200
    Y al consultar la línea de tiempo, el evento modificado no contiene atributos remanentes del tipo anterior

  # --- SAD PATHS ---

  Escenario: Rechazo cuando un valor numérico supera el límite máximo permitido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Patoruzú RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento     | posesion | tiempo_segundos | periodo |
      | Acarreo (Carry) | OWN      | 500             | 1       |
    Cuando el entrenador intenta enriquecer el evento "Acarreo (Carry)" con el atributo numérico "metersGained" y valor 150
    Entonces el sistema rechaza la modificación con código 409 por límite de rango

  Escenario: Rechazo cuando un valor numérico es inferior al límite mínimo permitido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Patoruzú RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento     | posesion | tiempo_segundos | periodo |
      | Acarreo (Carry) | OWN      | 550             | 1       |
    Cuando el entrenador intenta enriquecer el evento "Acarreo (Carry)" con el atributo numérico "metersGained" y valor -10
    Entonces el sistema rechaza la modificación con código 409 por límite de rango

  Escenario: Rechazo cuando una opción de selección es inválida
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Comodoro Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento                 | posesion | tiempo_segundos | periodo |
      | Penal / Infracción cometida | OWN      | 620             | 1       |
    Cuando el entrenador intenta enriquecer el evento "Penal / Infracción cometida" con el atributo select "penaltyType" y valor "OPCION_INEXISTENTE"
    Entonces el sistema rechaza la modificación con código 409 por opción inválida

  Escenario: Rechazo cuando se intenta enviar un atributo no declarado en el catálogo
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Trelew Rugby Club"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento | posesion | tiempo_segundos | periodo |
      | Scrum       | OWN      | 700             | 1       |
    Cuando el entrenador intenta enriquecer el evento "Scrum" con un atributo no permitido "campoInventado" y valor "prueba"
    Entonces el sistema rechaza la modificación con código 409 por atributo no permitido

  Escenario: Rechazo cuando el tipo de dato no coincide con la definición del campo
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Calafate RC"
    Y que se han registrado los siguientes eventos en el partido:
      | tipo_evento     | posesion | tiempo_segundos | periodo |
      | Acarreo (Carry) | OWN      | 800             | 1       |
    Cuando el entrenador intenta enriquecer el evento "Acarreo (Carry)" con el atributo "metersGained" enviando texto "muchos_metros"
    Entonces el sistema rechaza la modificación con código 409 por tipo de dato inválido
