# language: es
Característica: Verificación del estado de salud del backend

  Escenario: El backend y la base de datos están operativos
    Cuando consulto el endpoint de salud "/actuator/health"
    Entonces el código de respuesta debe ser 200
    Y el estado del servicio debe ser "UP"
