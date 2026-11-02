# language: es
@hu-zonas
Característica: Zonas de la cancha por período de tiempo en post-partido
  Como entrenador o analista
  Quiero asignar zonas de la cancha a períodos de tiempo específicos del partido
  Para que los eventos queden vinculados automáticamente a la zona donde ocurrieron

  # Convenciones de esta característica:
  # - Grilla fija de 3 filas x 6 columnas, indexada desde 1 (fila 1-3, columna 1-6).
  # - Los minutos son de partido acumulado: el 1T va de 0 a 40 y el 2T de 40 a 80.
  # - Un rango es [inicio, fin): 10-25 y 25-40 son contiguos y no se solapan.
  # - La zona de un evento se deriva de su minuto; un evento fuera de todo rango queda "sin zona".
  # - El tiempo añadido cuenta como el minuto 40 (1T) y el minuto 80 (2T).
  # - Solo se pueden editar zonas de partidos FINISHED.

  # --- HAPPY PATHS ---

  Escenario: Asignar una zona a un período del primer tiempo
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 01"
    Cuando el entrenador asigna la zona fila 2 columna 3 al periodo 1 entre el minuto 10 y el minuto 25
    Entonces el sistema responde con código 201
    Y la zona asignada se devuelve con fila 2, columna 3, periodo 1, desde el minuto 10 hasta el minuto 25

  Escenario: Los eventos del período quedan vinculados automáticamente a la zona
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 02"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Cuando el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 15 del periodo 1
    Entonces el sistema responde con código 200
    Y el evento "Tackle completado" del minuto 15 del periodo 1 pertenece a la zona fila 2 columna 3

  Escenario: Los eventos ya existentes se vinculan al crear la zona
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 03"
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 12 del periodo 1
    Cuando el entrenador asigna la zona fila 1 columna 2 al periodo 1 entre el minuto 5 y el minuto 20
    Y el entrenador consulta la línea de eventos del partido cerrado
    Entonces el evento "Tackle completado" del minuto 12 del periodo 1 pertenece a la zona fila 1 columna 2

  Escenario: Un evento fuera de todo período asignado queda sin zona
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 04"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Cuando el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 30 del periodo 1
    Entonces el evento "Tackle completado" del minuto 30 del periodo 1 queda sin zona

  Escenario: Períodos contiguos no se solapan y el límite pertenece al período siguiente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 05"
    Y que el partido tiene asignada la zona fila 1 columna 1 en el periodo 1 entre el minuto 10 y el minuto 25
    Cuando el entrenador asigna la zona fila 3 columna 6 al periodo 1 entre el minuto 25 y el minuto 40
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 25 del periodo 1
    Entonces el evento "Tackle completado" del minuto 25 del periodo 1 pertenece a la zona fila 3 columna 6

  Escenario: El minuto 40 del primer tiempo pertenece al tramo que termina en 40
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 40"
    Y que el partido tiene asignada la zona fila 2 columna 4 en el periodo 1 entre el minuto 31 y el minuto 40
    Cuando el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 40 del periodo 1
    Entonces el evento "Tackle completado" del minuto 40 del periodo 1 pertenece a la zona fila 2 columna 4

  Escenario: El minuto 80 del segundo tiempo pertenece al tramo que termina en 80
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 41"
    Y que el partido tiene asignada la zona fila 3 columna 5 en el periodo 2 entre el minuto 68 y el minuto 80
    Cuando el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 80 del periodo 2
    Entonces el evento "Tackle completado" del minuto 80 del periodo 2 pertenece a la zona fila 3 columna 5

  Escenario: Zonas en ambos tiempos del partido
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 06"
    Y que el partido tiene asignada la zona fila 1 columna 1 en el periodo 1 entre el minuto 0 y el minuto 40
    Cuando el entrenador asigna la zona fila 3 columna 6 al periodo 2 entre el minuto 40 y el minuto 80
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 50 del periodo 2
    Entonces el evento "Tackle completado" del minuto 50 del periodo 2 pertenece a la zona fila 3 columna 6

  Escenario: Editar la zona de un período reubica sus eventos
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 07"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 15 del periodo 1
    Cuando el entrenador modifica la zona asignada a fila 3 columna 5 entre el minuto 10 y el minuto 25
    Entonces el sistema responde con código 200
    Y el evento "Tackle completado" del minuto 15 del periodo 1 pertenece a la zona fila 3 columna 5

  Escenario: Reducir el rango de una zona deja sin zona a los eventos que quedan fuera
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 08"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 20 del periodo 1
    Cuando el entrenador modifica la zona asignada a fila 2 columna 3 entre el minuto 10 y el minuto 15
    Entonces el sistema responde con código 200
    Y el evento "Tackle completado" del minuto 20 del periodo 1 queda sin zona

  Escenario: Eliminar una zona deja sin zona a sus eventos
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 09"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 15 del periodo 1
    Cuando el entrenador elimina la zona asignada
    Entonces el sistema responde con código 204
    Y el evento "Tackle completado" del minuto 15 del periodo 1 queda sin zona

  Escenario: Resumen de eventos por celda para el gráfico de la cancha
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 10"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 12 del periodo 1
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 18 del periodo 1
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 35 del periodo 1
    Cuando el entrenador consulta las zonas del partido
    Entonces el sistema responde con código 200
    Y la consulta devuelve 1 asignación de zona
    Y el resumen indica 2 eventos en la fila 2 columna 3
    Y el resumen indica 1 evento sin zona

  Escenario: Un partido sin zonas asignadas devuelve el resumen vacío
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 11"
    Cuando el entrenador consulta las zonas del partido
    Entonces el sistema responde con código 200
    Y la consulta devuelve 0 asignaciones de zona

  Escenario: Un evento eliminado deja de contar en el resumen de la zona
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 12"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Y el entrenador agrega post-partido el evento "Tackle completado" para el equipo propio en el minuto 15 del periodo 1
    Cuando el entrenador elimina el último evento agregado
    Y el entrenador consulta las zonas del partido
    Entonces el resumen indica 0 eventos en la fila 2 columna 3

  # --- SAD PATHS: reglas de negocio ---

  Escenario: No se pueden asignar zonas a un partido que no está finalizado
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido no iniciado para la división "Primera" contra "Zonas RC 13"
    Cuando el entrenador asigna la zona fila 2 columna 3 al periodo 1 entre el minuto 10 y el minuto 25
    Entonces el sistema rechaza la solicitud con código 409

  Escenario: No se permite una zona que se solapa con otra del mismo período
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 14"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 10 y el minuto 25
    Cuando el entrenador asigna la zona fila 1 columna 1 al periodo 1 entre el minuto 20 y el minuto 30
    Entonces el sistema rechaza la solicitud con código 409

  Escenario: Editar una zona para que se solape con otra es rechazado
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 15"
    Y que el partido tiene asignada la zona fila 2 columna 3 en el periodo 1 entre el minuto 0 y el minuto 10
    Y que el partido tiene asignada la zona fila 1 columna 1 en el periodo 1 entre el minuto 10 y el minuto 20
    Cuando el entrenador modifica la zona asignada a fila 1 columna 1 entre el minuto 5 y el minuto 20
    Entonces el sistema rechaza la solicitud con código 409

  Esquema del escenario: Rangos de tiempo inválidos son rechazados
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 16"
    Cuando el entrenador asigna la zona fila 2 columna 3 al periodo <periodo> entre el minuto <inicio> y el minuto <fin>
    Entonces el sistema rechaza la solicitud con código 400 o 409

    Ejemplos:
      | periodo | inicio | fin | motivo                               |
      | 1       | 20     | 10  | inicio mayor que fin                 |
      | 1       | 10     | 10  | rango vacío                          |
      | 1       | -5     | 10  | minuto negativo                      |
      | 1       | 30     | 45  | el 1T no puede superar el minuto 40  |
      | 2       | 30     | 50  | el 2T no puede empezar antes del 40  |
      | 2       | 60     | 85  | el 2T no puede superar el minuto 80  |
      | 3       | 10     | 20  | período inexistente                  |

  Esquema del escenario: Celdas fuera de la grilla 3x6 son rechazadas
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 17"
    Cuando el entrenador asigna la zona fila <fila> columna <columna> al periodo 1 entre el minuto 10 y el minuto 25
    Entonces el sistema rechaza la solicitud con código 400 o 409

    Ejemplos:
      | fila | columna | motivo                  |
      | 0    | 1       | fila por debajo de 1    |
      | 4    | 1       | fila por encima de 3    |
      | 1    | 0       | columna por debajo de 1 |
      | 1    | 7       | columna por encima de 6 |

  Escenario: Datos incompletos al asignar una zona son rechazados
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 18"
    Cuando el entrenador intenta asignar una zona sin indicar la fila
    Entonces el sistema rechaza la solicitud con código 400

  # --- SAD PATHS: recursos inexistentes ---

  Escenario: Asignar zona a un partido inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando el entrenador intenta asignar una zona a un partido inexistente
    Entonces el sistema rechaza la solicitud con código 404

  Escenario: Modificar una zona inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 19"
    Cuando el entrenador intenta modificar una zona inexistente
    Entonces el sistema rechaza la solicitud con código 404

  Escenario: Eliminar una zona inexistente
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 20"
    Cuando el entrenador intenta eliminar una zona inexistente
    Entonces el sistema rechaza la solicitud con código 404

  # --- SAD PATHS: seguridad ---

  Escenario: Consultar o asignar zonas sin autenticación
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 21"
    Cuando alguien sin autenticar intenta asignar una zona al partido
    Entonces el sistema rechaza la solicitud con código 401 o 403

  Escenario: Un usuario sin rol deportivo no puede asignar zonas
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 22"
    Y que el usuario con rol jugador con email "usuario.norole@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando el entrenador asigna la zona fila 2 columna 3 al periodo 1 entre el minuto 10 y el minuto 25
    Entonces el sistema rechaza la solicitud con código 403

  Escenario: Un usuario sin rol deportivo no puede consultar las zonas
    Dado que el entrenador con email "jugador.uno@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado para la división "Primera" contra "Zonas RC 23"
    Y que el usuario con rol jugador con email "usuario.norole@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando el entrenador consulta las zonas del partido
    Entonces el sistema rechaza la solicitud con código 403

  Escenario: Un entrenador de otro club no puede asignar zonas a un partido ajeno
    Dado que el entrenador del club "Bigornia Club" con email "rival@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado del club ajeno contra "Zonas RC 24"
    Cuando el entrenador asigna la zona fila 2 columna 3 al periodo 1 entre el minuto 10 y el minuto 25
    Entonces el sistema rechaza la solicitud con código 403 o 404

  Escenario: Un entrenador de otro club no puede consultar las zonas de un partido ajeno
    Dado que el entrenador del club "Bigornia Club" con email "rival@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe un partido finalizado del club ajeno contra "Zonas RC 25"
    Cuando el entrenador consulta las zonas del partido
    Entonces el sistema rechaza la solicitud con código 403 o 404
