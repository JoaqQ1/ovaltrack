# language: es
Característica: Registro de Entrenador / Analista
  Módulo responsable de registrar un Entrenador / Anlista a la plataforma con un club relacionado

  Esquema del escenario: Registrar un nuevo coach a la comunidad para que forme parte del equipo 
    Dado el usuario con "<firstName>" "<lastname>" "<email>" "<password>" "<birthDate>" "<requestedRole>" "<clubName>" "<clubCity>"
    Cuando se presiona el botón Enviar solicitud de acceso
    Entonces se espera el siguiente <status> con la "<response>"

    Ejemplos:
      | firstName| lastname | email                   | password       | birthDate  | requestedRole  | clubName | clubCity      | status | response                                                        |
      | Felipe  | Contepomi| felipe.conte@test.com   | PassSegura123! | 1977-10-20 | COACH_ANALYST  | PMRC     | Puerto Madryn | 201    | Solicitud de registro creada con éxito. Pendiente de aprobación |
      | Gonzalo | Quesada  | gonza.quesa@test.com    | PassSegura123! | 1974-05-02 | COACH_ANALYST  | PMRC     | Puerto Madryn | 201    | Solicitud de registro creada con éxito. Pendiente de aprobación |
      | Pablo   | Bouza    | pablo.bouza@test.com    | PassSegura123! | 1973-05-09 | COACH_ANALYST  | PMRC     | Puerto Madryn | 201    | Solicitud de registro creada con éxito. Pendiente de aprobación |
      | Rodolfo | Ambrosio | rodo.ambrosi@test.com   | PassSegura123! | 1961-12-27 | COACH_ANALYST  | TRC      | Puerto Madryn | 201    | Solicitud de registro creada con éxito. Pendiente de aprobación |
      | Juan    | Imhoff   | juan.imhoff@test.com    | PassSegura123! | 1988-05-11 | COACH_ANALYST  | TRC      | Puerto Madryn | 201    | Solicitud de registro creada con éxito. Pendiente de aprobación |