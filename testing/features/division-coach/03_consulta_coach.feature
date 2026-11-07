# language: es
Característica: Consulta de la asociación de un coach a una división
  Como administrador de club
  Quiero consultar la asociación de un coach con una división
  Para conocer desde cuándo integra el cuerpo técnico

  Escenario: El administrador consulta la asociación vigente de un coach
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta por su ID la asociación del coach "felipe.conte@test.com" a la division "Primera"
    Entonces el sistema responde con 200
    Y la asociación corresponde al coach consultado y sigue vigente

  Escenario: No se puede consultar una asociación de coach inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando consulta la asociación de coach inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "No se encontro al entrenador asociado a la division"
