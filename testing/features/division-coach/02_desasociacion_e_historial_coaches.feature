# language: es
Característica: Desasociación e historial de coaches de una división
  Como administrador de club
  Quiero desasociar coaches de una división y consultar su historial
  Para mantener actualizado el cuerpo técnico conservando el registro de quiénes pasaron por la división

  Escenario: El administrador de club desasocia a un coach de una división
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando desasocia al coach "pablo.bouza@test.com" de la division "Primera"
    Entonces el sistema responde con 200 y "Entrenador eliminado correctamente"
    Y el coach "pablo.bouza@test.com" ya no figura entre los coaches de la division "Primera"

  Escenario: El historial de un coach desasociado registra la fecha de fin de su asociación
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el historial del coach "pablo.bouza@test.com" en la division "Primera"
    Entonces el sistema responde con 200
    Y el historial tiene una asociación finalizada

  Escenario: El historial de un coach asociado muestra su asociación vigente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta el historial del coach "felipe.conte@test.com" en la division "Primera"
    Entonces el sistema responde con 200
    Y el historial tiene una asociación vigente

  Escenario: No se puede desasociar a un coach que ya fue desasociado
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta desasociar nuevamente al coach "pablo.bouza@test.com" de la division "Primera"
    Entonces el sistema responde con 409 y "No se puede desasociar un entrenador que ya no esta asociado a la division"

  Escenario: No se puede desasociar una asociación de coach inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando desasocia la asociación de coach inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "No se puede desasociar un entrenador que no existe"
