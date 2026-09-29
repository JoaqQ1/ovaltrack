# language: es
Característica: Consulta y cálculo de estadísticas de período de un partido
  Como entrenador o analista táctico
  Quiero consultar las estadísticas calculadas para un período de un partido
  Para evaluar el rendimiento del equipo en tanteador, tackles, disciplina y posesión

  Escenario: Cálculo exitoso de estadísticas tácticas del primer tiempo con eventos registrados
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Bigornia Club"
    Y que se han registrado los siguientes eventos en el primer tiempo:
      | tipo_evento       | posesion | tiempo_segundos | periodo |
      | Try               | OWN      | 300             | 1       |
      | Drop gol          | OWN      | 360             | 1       |
      | Penal a los palos | OWN      | 700             | 1       |
      | Tackle completado | OWN      | 800             | 1       |
      | Tackle fallado    | OWN      | 850             | 1       |
      | Try               | OPPONENT | 1200            | 1       |
      | Scrum             | OWN      | 1500            | 1       |
    Cuando el entrenador consulta las estadísticas del período 1 para el partido
    Entonces el sistema responde con código 200 y devuelve las estadísticas calculadas:
      | campo                  | valor |
      | ownScore               | 11    |
      | opponentScore          | 5     |
      | ownTries               | 1     |
      | opponentTries          | 1     |
      | ownDropGoals           | 1     |
      | ownPenalties           | 1     |
      | ownTacklesCompleted    | 1     |
      | ownTacklesMissed       | 1     |
      | ownTackleEffectiveness | 50.0  |
      | scrumsTotal            | 1     |

  Escenario: Cálculo de estadísticas para un período sin eventos
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido en curso para la división "Primera" contra "Patoruzu Rugby Club"
    Cuando el entrenador consulta las estadísticas del período 1 para el partido
    Entonces el sistema responde con código 200 y devuelve las estadísticas calculadas:
      | campo                   | valor |
      | ownScore                | 0     |
      | opponentScore           | 0     |
      | ownTacklesCompleted     | 0     |
      | ownTacklesMissed        | 0     |
      | ownTackleEffectiveness  | 0.0   |
      | ownPossessionPercentage | 50.0  |

  Escenario: Error al consultar estadísticas de un partido inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando el entrenador consulta las estadísticas del período 1 para un partido con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con código 404 y el mensaje "Partido no encontrado"
