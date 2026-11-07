# Fallos detectados al completar la suite BDD

Hallazgos del backend que salieron al escribir los tests de `testing/` (fases 0 a 5, noviembre de 2026).
Ningún test los fija: los escenarios correspondientes se agregarán cuando se corrija cada uno.

**Estado de la verificación**
- **Verificado en ejecución**: lo vi fallar corriendo la suite.
- **Verificado en código**: lo leí en el código fuente, sin ejecutarlo.
- **Sospecha**: deducido del código, no probado.

Los puntos 1 y 2 son los más graves.

---

## 1. Los partidos no validan el club del usuario (fuga entre clubes)

**Verificado en código.** `MatchSecurityValidator.validateCanManageMatch` ya existe y exige ser admin de OvalTrack, admin del club del partido o coach asignado a la división. Pero casi nadie lo llama, y `MatchController` no tiene `@PreAuthorize`.

| Operación | ¿Valida el club? |
|---|---|
| `PUT /matches/{id}/close-first-half`, `/start-second-half` | Sí |
| `/event` (alta, edición, baja, post-partido) y `/matches/{id}/zones` | Sí |
| `PUT /matches/{id}/start`, `/finish`, `DELETE /matches/{id}/cancel` | **No** |
| `POST /matches/{id}/roster`, `PUT /matches/{id}` | **No** |
| `PUT /matches/{id}/live-state` | **No** |
| `GET /matches/{id}`, `/roster`, `/live-bootstrap` | **No** |
| `POST /matches` (crear) | **No**: solo comprueba que la división exista |

**Efecto:** cualquier usuario con sesión, incluso un jugador de otro club, puede cancelar o finalizar un partido ajeno, cambiar su plantel, pisar su reloj en vivo o crear partidos en divisiones de otros clubes.

**Dónde:** `match/controller/MatchController.java`, `match/business/MatchService.java` (solo `closeFirstHalf` y `startSecondHalf` reciben `Authentication`).

**Corrección sugerida:** pasar `Authentication` desde el controller y llamar a `validateCanManageMatch` en esos métodos de `MatchService`; para crear un partido, validar con `DivisionSecurityValidator` sobre la división. Para las lecturas hay que decidir si se restringen igual o por división.

> Toca el aislamiento por club/división: `CLAUDE.md` pide confirmar antes de modificarlo.

---

## 2. Las estadísticas comparan nombres que no existen en el catálogo

**Verificado en código** (estrategias contra `staging/event_type.sql`). Las estrategias de `statistic/business/strategy/` comparan el **nombre** del tipo de evento:

| La estrategia busca | El catálogo tiene | Estrategia |
|---|---|---|
| `"Penal a los palos"` | `"Kick H (Penal a palos)"` | `ScoreStatisticStrategy` |
| `"Drop gol"` | `"Drop goal"` | `ScoreStatisticStrategy` |
| `"Penal / infracción"` | `"Penal / Infracción"` (cambia la mayúscula) | `DisciplineStatisticStrategy` |
| `"Amonestación"` | `"Tarjeta Amarilla"` | `DisciplineStatisticStrategy` |
| `"Expulsión"` | `"Tarjeta Roja / Expulsión"` | `DisciplineStatisticStrategy` |

**Efecto:** penales, drops, penales concedidos y tarjetas nunca se cuentan. Como el marcador del partido (`Match.homeScore`, calculado en `EventService.recalculateMatchScore`) sí suma penales y drops, un mismo partido puede mostrar dos puntajes distintos.

**Corrección sugerida:** comparar por `code` del tipo de evento (`DROP_GOAL`, `CONVERSION`, etc.) en vez de por nombre.

---

## 3. La conversión errada suma 2 puntos en las estadísticas

**Verificado en código.** `ScoreStatisticStrategy` suma 2 por cada evento "Conversión" sin mirar `wasSuccessful`. En cambio `EventRules.countsAsScoring` (marcador del partido) sí respeta ese atributo: una conversión con `wasSuccessful=false` da 0 en el marcador y 2 en las estadísticas.

**Corrección sugerida:** reutilizar `EventRules.countsAsScoring` en la estrategia.

---

## 4. `GET /api/invitation` responde 500

**Verificado en ejecución.** Error: `Type definition error: [simple type, class org.hibernate.proxy.pojo.bytebuddy.ByteBuddyInterceptor]`. El controller devuelve la entidad `Invitation` y Jackson no puede serializar sus proxies de Hibernate.

**Dónde:** `invitations/controller/InvitationController.java:33`, `InvitationService.findAll()`.

**Corrección sugerida:** devolver un DTO (`InvitationResponse.from(...)`, que ya usa `invite`). Probablemente le pasa lo mismo a `GET /api/invitation/id/{id}`, no lo probé. Este endpoint tiene el `@PreAuthorize` comentado, así que hoy cualquier usuario con sesión lo puede llamar.

---

## 5. IDs inexistentes devuelven 200 con cuerpo vacío en vez de 404

**Verificado en código.**

| Endpoint | Causa |
|---|---|
| `GET /matches/{id}` | `findMatchById` devuelve `null` y el controller lo envuelve en 200 |
| `GET /event/{id}` | `findEventById` devuelve `null`, igual |
| `GET /matches/{id}/roster` | `getSavedRoster` devuelve listas vacías si el partido no existe |

Los otros endpoints de partido (`live-state`, `live-bootstrap`, `roster/players`) sí devuelven 404 "Partido no encontrado". `GET /players/{id}` y `GET /coaches/{id}` también responden 404 correctamente.

**Corrección sugerida:** lanzar `EntityNotFoundException`, como el resto.

---

## 6. Registro por invitación con un token inexistente (sospecha)

**Sospecha, no probado.** `InvitationService.findUsableInvitation` hace `token.getHash()` sin comprobar que `tokenService.findUsable(...)` no devolvió `null` (`InvitationService.java:167-170`). Con un token desconocido en `POST /api/auth/register/invitation` debería dar `NullPointerException` y un 500, mientras que `POST /api/invitation/validate` sí maneja el caso ("Token no encontrado.").

**Corrección sugerida:** lanzar `BusinessException("Token no encontrado.")` si es `null`.

---

## 7. `PUT /matches/{id}` no valida el solapamiento horario

**Verificado en código.** `MatchService.saveMatch` rechaza un partido que se solape con otro de la división (409 "Ya existe un partido planeado en esa franja horaria"), pero `updateMatch` no, así que se puede mover un partido encima de otro.

**Corrección sugerida:** extraer la validación de franja a un método y usarla en ambos, excluyendo el propio partido al editar.

---

## Pendientes de cobertura (no son fallos)

- El mismo `clientEventId` en otro partido (409 "El identificador del evento ya pertenece a otro partido") no tiene escenario: requiere dos partidos en un mismo escenario.
- `POST /api/invitation/invite` solo tiene cubiertos los casos de error. El caso exitoso enviaría un mail real si hay SMTP configurado en `.env`.
- Un evento de captura en vivo sobre un partido `FINISHED` se acepta (solo se bloquean los cancelados); no se definió si es una regla o una omisión.
