# language: es
Característica: Creación de Clubes (Soporte Multiclub)
  Escenario: Creación exitosa de los clubes iniciales
    Dado que existe un club previamente registrado con los siguientes datos:
      | nombre       | ciudad | administrador            |
      | Primer Club  | Trelew | admin_multiclub@test.com |
    Cuando completo el formulario de creación de club con los siguientes datos:
      | nombre               | ciudad        | administrador         |
      | Puerto Madryn Rugby  | Puerto Madryn | admin_puerto@test.com |
    Y presiono el botón "Guardar Club"
    Entonces el sistema confirma la creación exitosa del club

  Escenario: Error al intentar crear un club dejando el nombre vacío
    Cuando completo el formulario de creación de club con los siguientes datos:
      | nombre | ciudad | administrador         |
      |        | Ciudad | admin_puerto@test.com |
    Y presiono el botón "Guardar Club"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "El nombre del club es obligatorio"

  Escenario: Un usuario no puede ser administrador de dos clubes distintos
    Cuando completo el formulario de creación de club con los siguientes datos:
      | nombre        | ciudad | administrador            |
      | Segundo Club  | Rawson | admin_multiclub@test.com |
    Y presiono el botón "Guardar Club"
    Entonces el sistema rechaza la solicitud con código 409 y el mensaje "viola una restricción de datos"
