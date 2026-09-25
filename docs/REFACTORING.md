# REFACTORING.md — Reglas de refactor para OvalTrack

## 0. Qué es este documento y cómo usarlo

Esta es una guía operativa para un **agente de código** que va a refactorizar el backend
(Java/Spring) o el frontend (Angular/TypeScript) de OvalTrack. Complementa a `AGENTS.md` /
`CLAUDE.md` (cómo correr y construir el proyecto) y a `DESIGN_SYSTEM.md` (cómo se ve la UI).
Este documento responde una sola pregunta: **qué refactor aplicar, cuándo, y con qué
seguridad**.

**Definición de trabajo (Fowler):** refactorizar es cambiar la estructura interna de un
código sin cambiar su comportamiento observable. Si un cambio altera lo que el sistema hace
—aunque sea "mejorándolo"— no es un refactor, es una feature o un fix, y se trata como tal
(commit separado, tests nuevos que describan el comportamiento nuevo).

El agente debe recorrer este documento en orden: primero los principios (sección 1) y el
protocolo (sección 2) son obligatorios siempre. Después, para decidir *qué técnica* usar, va
a la tabla síntoma → refactor (sección 4), que apunta al nivel correspondiente del catálogo
(sección 3). Los niveles 0–3 son el catálogo de Fowler ordenado de menor a mayor riesgo; el
nivel 4 es Evans/DDD y tiene compuerta de entrada propia — no se usa por defecto.

---

## 1. Principios no negociables

1. **Sin tests en verde no hay refactor.** Antes de tocar código, correr la suite relevante
   y confirmar que pasa. Si el código a tocar no tiene test que lo cubra, el primer paso es
   escribir un test de caracterización (que describe el comportamiento actual, no el
   deseado) — recién después se refactoriza.
2. **Un refactor = un commit.** Nunca mezclar un refactor con un cambio de comportamiento,
   un fix de bug o una feature nueva en el mismo commit. Si en el camino se detecta un bug,
   se anota y se corrige aparte.
3. **Pasos chicos y reversibles.** Cada paso del catálogo se aplica de forma completa y
   mecánica, se compila/testea, y recién ahí se da el siguiente paso. Si algo se rompe, el
   paso anterior era demasiado grande: partirlo más chico, no debuggear a mitad de camino.
4. **Regla de las tres repeticiones (Rule of Three).** No abstraer ante la primera
   duplicación. Tolerarla la primera vez, fruncir el ceño la segunda, recién extraer en la
   tercera. Esto aplica con más fuerza todavía a los patrones de Nivel 4 (DDD): una
   abstracción de dominio mal anticipada cuesta más deshacerla que una duplicación chica.
5. **El build queda verde siempre.** Backend: `./ds.sh compile` sin errores. Frontend: la
   compilación Angular sin warnings nuevos de tipado (nada de `any` introducido "para que
   compile").
6. **Los cambios de esquema JPA son de riesgo especial.** Ver sección 6 — no hay migraciones
   formales (`ddl-auto=update`), así que un refactor de entidad no es solo un refactor de
   código.

---

## 2. Protocolo paso a paso

1. **Identificar el síntoma.** No se refactoriza "porque sí" ni por preferencia estética. Se
   nombra el code smell concreto (sección 4) que motiva el cambio.
2. **Verificar cobertura.** ¿Hay un test que falla si rompo esto? Si el código está en
   `service/` del backend, el requisito no funcional de Mantenibilidad del documento de
   visión exige cobertura ahí — si no existe, se agrega antes de refactorizar.
3. **Elegir el refactor más chico que resuelve el síntoma.** Empezar por Nivel 0. Subir de
   nivel solo si el nivel anterior no alcanza para resolver el síntoma identificado.
4. **Aplicar un solo refactor a la vez**, de forma mecánica (seguir los pasos de la técnica,
   no improvisar variantes).
5. **Correr tests:**
   - Cambio contenido en una clase / sin tocar contratos → tests unitarios del módulo.
   - Cambio que toca `controller/`, contratos JSON, o lógica de negocio expuesta por la API
     → además correr `./ds.sh test` (Cucumber) con el backend levantado.
6. **Commit atómico**, formato: `refactor(<módulo>): <técnica> — <razón breve>`
   Ejemplo: `refactor(event-service): extract method calcularPosesion — reduce complejidad en registrarEvento()`
7. Repetir desde el paso 1 para el siguiente síntoma.

---

## 3. Catálogo de refactors, de menor a mayor riesgo

### Nivel 0 — Micro (riesgo ~nulo, aplicar libremente, sin pedir permiso)

| Técnica | Qué hace |
|---|---|
| Rename Variable / Field / Method / Class | El nombre no describe lo que hace o contiene; se renombra para que sea autoexplicativo. |
| Extract Variable (Introduce Explaining Variable) | Una expresión compleja se asigna a una variable con nombre que explica su intención. |
| Inline Variable | Una variable no agrega claridad sobre la expresión que contiene; se elimina y se usa la expresión directa. |
| Replace Temp with Query | Una variable temporal que guarda el resultado de una expresión se reemplaza por un método que calcula ese valor bajo demanda. Habilita luego Extract Method sin arrastrar variables locales. |
| Remove Dead Code / Remove Unused Parameter | Código o parámetros que ya no se usan. |
| Consolidate Duplicate Conditional Fragments | Código idéntico repetido dentro de las distintas ramas de un `if/else` se saca afuera del condicional. |
| Split Variable | Una variable que se reasigna para representar cosas distintas (ej. un acumulador reusado para dos propósitos) se separa en dos variables con nombre propio. |

### Nivel 1 — Función / método (riesgo bajo)

| Técnica | Qué hace |
|---|---|
| Extract Function/Method | Un fragmento de código con una intención identificable se convierte en su propia función/método con nombre que dice qué hace, no cómo. |
| Inline Function | Una función cuyo cuerpo es tan claro como su nombre no aporta indirección; se inlinea. |
| Change Function Declaration | Renombrar la función y/o agregar, quitar o reordenar parámetros para que la firma comunique mejor su intención. |
| Introduce Parameter Object | Un grupo de parámetros que siempre viaja junto (data clump) se agrupa en un objeto propio. |
| Combine Functions into Class | Varias funciones que operan sobre los mismos datos se agrupan en una clase. |
| Separate Query from Modifier (CQS) | Un método que devuelve un valor *y* muta estado se separa en un método de consulta (sin efectos) y uno de comando (sin retorno útil). |
| Remove Flag Argument | Un booleano que cambia el comportamiento interno de la función se reemplaza por dos funciones explícitas. |
| Preserve Whole Object | En vez de extraer varios valores de un objeto para pasarlos como parámetros sueltos, se pasa el objeto completo. |

### Nivel 2 — Clase / módulo (riesgo medio — revisar impacto en otras clases)

| Técnica | Qué hace |
|---|---|
| Extract Class | Una clase que hace más de una cosa (viola SRP) se divide en dos, cada una con una responsabilidad. |
| Inline Class | Una clase que ya no justifica existir por sí sola se fusiona con la que más la usa. |
| Move Function / Move Field | Un método o campo se usa más desde otra clase que desde la propia (feature envy) — se mueve a donde corresponde. |
| Hide Delegate / Remove Middle Man | Ajustar cuánto expone una clase de sus colaboradores internos (encapsular cadenas de llamadas, o eliminar una envoltura que ya no aporta). |
| Encapsulate Variable / Field / Collection | Un campo público o una colección mutable expuesta directamente se encapsula detrás de accessors controlados. |
| Replace Constructor with Factory Function | Cuando la construcción de un objeto necesita lógica (validación, elegir subtipo) que no encaja bien en un constructor plano. |
| Introduce Assertion | Documentar una precondición implícita como una aserción explícita en el código. |

### Nivel 3 — Estructural / condicionales / jerarquía (riesgo alto — exigir cobertura sólida antes de tocar)

| Técnica | Qué hace |
|---|---|
| Decompose Conditional | Un `if/else` con lógica compleja en cada rama se extrae en funciones con nombre (`if (esElegibleParaDescuento())` en vez de la expresión booleana completa inline). |
| Replace Nested Conditional with Guard Clauses | Condicionales anidados varios niveles se aplanan con retornos tempranos para el caso excepcional. |
| Replace Conditional with Polymorphism | Un `switch`/`if` que se repite en varios lugares distinguiendo por un "tipo" (type code) se reemplaza por subtipos que implementan el comportamiento cada uno. |
| Replace Type Code with Subclasses / State / Strategy | Un campo que indica "tipo" y condiciona comportamiento en varios métodos se modela como jerarquía o como Strategy inyectable. |
| Extract Superclass / Extract Interface | Dos clases comparten comportamiento o contrato; se sube a una superclase o se extrae una interfaz común. |
| Collapse Hierarchy | Una jerarquía de clases dejó de justificar sus niveles; se aplana. |
| Replace Inheritance with Delegation | Una subclase solo reutiliza parte del comportamiento del padre y rompe el resto (viola LSP); se reemplaza herencia por composición. |
| Split Phase | Un método que hace dos cosas en secuencia (ej. "parsear" y luego "calcular") se separa en dos pasos con un objeto intermedio explícito entre ambos. |

### Nivel 4 — Patrones tácticos de DDD (Evans) — **solo si se justifica**

No usar por defecto. Antes de aplicar cualquier técnica de este nivel, el agente debe poder
responder por escrito en el commit (o en el PR): **qué invariante de negocio protege este
patrón, y por qué un refactor de Nivel 0–3 no alcanza.** Si no hay respuesta clara, no se
aplica — se vuelve a un nivel inferior o se deja como está.

| Técnica | Cuándo se justifica en OvalTrack | Cuándo NO |
|---|---|---|
| **Value Object** | Un grupo de datos primitivos tiene invariantes propios, comportamiento, e igualdad por valor (no por identidad), y aparece repetido en 3+ lugares. Candidato real: el par reloj-de-juego/marca-de-tiempo-real de `Event` (uno se pausa, el otro nunca) — hoy son campos sueltos; si la lógica de "calcular tiempo efectivo" se repite en más de un servicio, extraerlo a un VO propio. | Mientras el catálogo de eventos de la Fase 1 sigue cambiando. No convertir `EventPossession`/`EventCategory` en algo más que enums — ya cumplen su función. |
| **Entity vs Value Object** (distinguir explícitamente identidad vs estructura) | Al decidir si un nuevo concepto necesita `id` propio (Entity) o si dos instancias son iguales si sus datos son iguales (VO). Usarlo como criterio de diseño al agregar clases nuevas, no como refactor retroactivo masivo. | No re-litigar entidades JPA ya estables (`Match`, `Division`, `Club`) solo por prolijidad conceptual. |
| **Aggregate / Aggregate Root** | Si aparece una invariante que cruza varias entidades y hoy nada la garantiza (ej. "no se puede cerrar un tiempo si hay eventos con `matchTime` posterior al cierre", o "la suma de puntos de `Event` debe cuadrar con el marcador de `Match`"). La solución **no** es crear una clase `Aggregate` nueva con ceremonia DDD-pura — Spring Data JPA no la necesita. La solución es: todas las mutaciones que deben respetar esa invariante pasan por un único `MatchService` (Application Service) que la aplica, y no se permite mutar `Event` directamente desde otro punto de entrada. |
| **Domain Event** | Si se necesita reaccionar a "algo pasó en el dominio" (ej. recalcular estadísticas cuando se registra un try) de forma desacoplada del flujo principal. **Ojo con el nombre:** el dominio ya tiene una entidad literal llamada `Event` (evento de partido). Si se introduce el patrón Domain Event, nombrarlo `MatchDomainEvent` o similar — nunca `Event` a secas, para no colisionar conceptualmente con el modelo existente. | No introducir un bus de eventos de dominio solo para desacoplar dos servicios que hoy se llaman directo sin problema. Es sobre-ingeniería para el tamaño actual del sistema. |
| **Repository** (en el sentido DDD, no Spring Data) | Ya está cubierto en la práctica por los repositorios de Spring Data JPA. Solo se justifica una capa Repository *adicional* propia si en algún punto la consulta necesita reglas de negocio para decidir qué devolver (no solo filtros), y esa lógica no tiene un lugar natural en el Service. | No agregar una capa de indirección "Repository de dominio" sobre el `JpaRepository` solo por seguir el patrón al pie de la letra. |
| **Domain Service vs Application Service** | Distinguir: lógica que pertenece al dominio (reglas de rugby: cuándo un evento cambia la posesión) va en un Domain Service sin dependencias de infraestructura; orquestación (transacciones, llamadas a repositorios, mapeo a DTO) va en el Application Service (`@Service` típico de Spring). Usar esta distinción cuando un `*Service` empiece a mezclar reglas de negocio puras con `@Transactional`/acceso a datos en el mismo método — señal de Nivel 3 (Extract Class) resuelta con este criterio de corte. | No crear la separación de entrada si el servicio actual es chico y legible. |
| **Specification** | Si empiezan a aparecer combinaciones de filtros de negocio reutilizables sobre `Event` (ej. "eventos de ataque que afectan posesión y tienen jugador asignado") repetidas en más de un query. | Un filtro usado una sola vez — no vale la ceremonia. |
| **Bounded Context** | Solo relevante si el proyecto entra en Fase 2 (multi-club real) y el modelo empieza a divergir de verdad entre distintos tipos de club/deporte. Fuera de alcance de la Fase 1 actual. | No aplicar ahora — el propio documento de visión marca "sobrealcance" como riesgo identificado. |

---

## 4. Tabla síntoma → refactor (consulta rápida)

| Síntoma / code smell | Refactor recomendado | Nivel |
|---|---|---|
| Método largo, hace muchas cosas | Extract Function, repetido hasta que cada bloque tenga una sola intención | 1 |
| Lista de parámetros larga / mismos parámetros viajan juntos (data clump) | Introduce Parameter Object | 1 |
| Código duplicado en 3+ lugares | Extract Function / Extract Class, luego reusar | 1–2 |
| Clase que hace demasiado (God Class) | Extract Class | 2 |
| Un método usa más datos de otra clase que de la propia (feature envy) | Move Function | 2 |
| Grupo de primitivos que siempre viaja junto y tiene reglas propias | Introduce Parameter Object (si es solo agrupar) → Value Object (si además tiene invariantes/comportamiento, y ya se repitió 3 veces) | 1 → 4 |
| `switch`/`if` sobre un "tipo" que se repite en varios métodos | Replace Conditional with Polymorphism | 3 |
| Condicionales anidados / código en escalera | Replace Nested Conditional with Guard Clauses | 3 |
| Un cambio de negocio obliga a tocar muchas clases a la vez (shotgun surgery) | Move Function/Field para agrupar lo que cambia junto; considerar Inline Class | 2 |
| Una clase cambia por razones distintas y no relacionadas (divergent change) | Extract Class / Split Phase | 2–3 |
| Comentario que explica "qué hace" un bloque | Extract Function con nombre descriptivo (el nombre reemplaza al comentario) | 0–1 |
| Variable temporal reusada para calcular un valor una sola vez | Replace Temp with Query | 0 |
| Booleano que cambia el comportamiento interno de una función | Remove Flag Argument | 1 |
| (Frontend) `.subscribe()` anidados / callback hell en RxJS | Extraer cada paso a su propio operador con nombre, encadenar con `switchMap`/`mergeMap` en vez de anidar — equivalente frontend de Extract Function + Decompose Conditional | 1 |
| (Frontend) mismo estado derivado calculado en varios componentes | Extract Function a un servicio/`computed()` compartido | 1–2 |

---

## 5. Reglas específicas del proyecto (no se negocian por fuera de este documento)

- **Separación de capas.** Cualquier refactor que mezcle Entity, DTO, Mapper, Service y
  Controller en una misma clase se rechaza, sin importar cuánto "simplifique" el código en lo
  inmediato — `AGENTS.md` ya fija esta separación como norma del proyecto.
- **`ddl-auto=update` sin migraciones.** Un refactor que renombra, elimina o cambia el tipo de
  un campo en una entidad JPA no es solo un refactor de código: cambia el schema real de la
  base sin registro ni rollback. Ver sección 6 para cuándo esto requiere pausar y avisar.
- **Cucumber es la red de seguridad de contrato.** Las `.feature` y los steps están en
  español y corren contra el backend vivo (`./ds.sh test`). Cualquier refactor que toque
  `controller/` o cambie la forma de un JSON de respuesta se corre contra esa suite antes y
  después, sin excepción.
- **No correr `mvn`/`npm`/`ng` en el host.** Usar `./ds.sh compile`, `./ds.sh mvn <args>`, o el
  contenedor de frontend, tal como indica `AGENTS.md`.
- **Frontend: Signals/RxJS reactivo por sobre `.subscribe()` anidados.** Es la convención ya
  fijada en `CLAUDE.md`; un refactor que introduce un nuevo `.subscribe()` anidado donde antes
  no lo había es un paso hacia atrás, no un refactor válido.
- **Nada de `any` como atajo.** Si un refactor obliga a tipar algo que hoy no está tipado, tipar
  es parte del refactor — no se pospone con `any` "para que compile".
- **`Map<String, Object>` en `EventType.metadata` y `Event.attributes`.** Detectado como
  Primitive/Map Obsession. **No tocar todavía**: el catálogo de eventos de la Fase 1 sigue en
  movimiento y es exactamente el caso donde anticipar una abstracción sale caro. Reevaluar
  (Value Object o subtipos concretos, Nivel 4) recién cuando el mismo patrón de lectura del
  mapa aparezca en 3 o más lugares distintos del código.

---

## 6. Cuándo el agente debe detenerse y preguntarle a un humano

No autoaplicar, aunque el catálogo lo permita técnicamente:

- Cualquier refactor que cambie el contrato JSON expuesto por un `controller` (rompe frontend
  y/o los steps de Cucumber que dependen de esa forma).
- Cualquier refactor de una entidad JPA que implique migración de **datos**, no solo de
  código — dado que no hay migraciones formales, esto puede perder o corromper datos ya
  cargados.
- Cualquier cambio que toque la validación de rol o el aislamiento de datos por
  club/división (código de seguridad) — un error de refactor ahí no es un bug de estilo, es
  una fuga de datos entre clubes.
- Cualquier técnica de **Nivel 4 (DDD)** — necesitan justificación explícita por escrito antes
  de aplicarse (ver sección 3).
- Cualquier cambio que toque el mecanismo de sincronización offline-first (orden de guardado,
  timestamps, resolución de conflictos) — es el requisito no funcional más crítico del
  proyecto (0% de pérdida de eventos), y no se toca "de paso" dentro de otro refactor.

---

## 7. Nota de mantenimiento de este documento

Si en algún momento agregan un framework o convención nueva que cambie cómo se aplican estos
refactors (por ejemplo, si Fase 2 introduce un bus de eventos real, o si el catálogo de
`EventType` se estabiliza y se decide introducir el Value Object mencionado en la sección 5),
actualizar este archivo — no dejar que la práctica real diverja de lo que dice el documento,
mismo criterio que ya aplican en `DESIGN_SYSTEM.md` para el sistema visual.

Sugerido: agregar una línea corta en `AGENTS.md` que apunte acá, igual que `AGENTS.md` va a
apuntar a `DESIGN_SYSTEM.md` para lo visual:

```markdown
## Refactor
Todo refactor de backend o frontend debe seguir `REFACTORING.md`: catálogo por nivel de
riesgo, tabla síntoma→refactor, y los casos donde hay que parar y preguntar antes de aplicar.
```
