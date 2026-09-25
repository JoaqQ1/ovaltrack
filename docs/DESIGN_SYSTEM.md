# OvalTrack — Sistema de diseño (tema claro)

Este documento reemplaza a `guia-estilos-v4-claro.md`. Antes documentaba solo la pantalla de Gestión de Miembros; ahora es la **referencia única de estilo** para cualquier pantalla nueva del frontend, basada en los tres mockups ya construidos:

| Patrón de pantalla | Cuándo usarlo | Archivo de referencia |
|---|---|---|
| **Lista / gestión de registros** | Tablas o listados con filtros, acciones por fila, edición en lote | `gestion-miembros-v4-claro.html` |
| **Dashboard / selector** | Pantallas de entrada, launchers, tarjetas de navegación | `panel-control-v4-claro.html` |
| **Grilla de acciones densa** | Captura rápida, tagging, formularios de botones grandes | `carga-en-vivo-v4-claro.html` |

Si una pantalla nueva no encaja 100% en ninguno de los tres, se arma combinando los **componentes base** (sección 3) de la forma que tenga más sentido — nunca inventando un color, radio o sombra nuevo.

> **Nota de consistencia:** al construir los tres mockups por separado aparecieron micro-diferencias entre archivos (ej. `--error-tint` con 0.10 en uno y 0.14 en otro). Ya las corregí y dejé los tres alineados a los valores de este documento, que son los únicos válidos de acá en adelante.

---

## 1. Tokens de color (`:root`) — únicos y obligatorios

```css
:root{
  --bg:#f6f7f1; --surface:#ffffff; --surface-alt:#eef1e7; --surface-hover:#f1f3ea;
  --border:rgba(27,33,22,0.10); --border-strong:rgba(27,33,22,0.22);

  --text-primary:#1b2116; --text-secondary:#4b5540; --text-muted:#7c8571;

  /* Verde pasto — SOLO acciones primarias / confirmar / estado activo */
  --grass:#91da40; --grass-hover:#7fc932; --on-grass:#1d3700; --grass-deep:#3a6410;
  --grass-tint:rgba(145,218,64,0.18); --grass-tint-strong:rgba(145,218,64,0.30); --grass-border:rgba(90,150,30,0.45);

  /* Azul — rol Admin, foco, enlaces, elementos "instrumento" (reloj, headers oscuros) */
  --navy:#16324f; --navy-tint:rgba(22,50,79,0.08); --navy-border:rgba(22,50,79,0.30);
  --blue-mid:#2b6ca3; --blue-mid-tint:rgba(43,108,163,0.08); --blue-mid-hover:#24567f;

  /* Neutro — rol Jugador / "Staff" / sin rol */
  --player:#6b6f5f; --player-tint:rgba(20,25,15,0.05);

  /* Semántica */
  --warning:#8a5700; --warning-tint:rgba(253,176,34,0.20); --warning-border:rgba(154,104,0,0.4);
  --error:#b42318; --error-tint:rgba(240,68,56,0.14); --error-border:rgba(180,35,24,0.35);

  --radius-sm:6px; --radius-md:10px; --radius-lg:14px; --radius-pill:999px;
  --font-head:'Hanken Grotesk',sans-serif; --font-body:'Inter',sans-serif; --font-mono:'JetBrains Mono',monospace;
  --hit:48px; /* hit-target táctil mínimo, tablet-first */
}
```

**Regla semántica (no negociable):** verde = confirmar/activar/primario. Azul = identidad Admin, foco, enlaces. Ámbar = advertencia. Rojo = error/destructivo. Nunca usar un color fuera de su significado (ej. no hacer un botón de "eliminar" en verde, ni un CTA principal en azul).

## 2. Tipografía y bases globales

```html
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
```
- **Hanken Grotesk** (700/800): títulos, nombres de pantalla, nombres de tarjeta.
- **Inter** (400–700): todo el resto de la UI.
- **JetBrains Mono** (500–700): datos — emails, dorsales, contadores, reloj de partido.

```css
*{box-sizing:border-box;} html,body{margin:0;padding:0;}
body{background:var(--bg); color:var(--text-primary); font-family:var(--font-body); font-size:16px; line-height:1.5; -webkit-font-smoothing:antialiased;}
button,input{font-family:inherit; color:inherit;} button{cursor:pointer;}
:focus-visible{outline:2px solid var(--navy); outline-offset:2px;}
.topbar{height:4px; background:linear-gradient(90deg, var(--grass), var(--blue-mid));} /* firma de marca, va al tope de TODA pantalla */
```

---

## 3. Componentes base (usar en cualquier pantalla)

### Botones
```css
.btn{height:var(--hit); padding:0 20px; border-radius:var(--radius-md); border:1px solid transparent; font-weight:700; font-size:14.5px; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:all .15s ease;}
.btn-invite{background:var(--grass); color:var(--on-grass); box-shadow:0 6px 16px rgba(90,150,30,0.28);} /* CTA de mayor jerarquía de la pantalla */
.btn-invite:hover{background:var(--grass-hover);}
.btn-outline{background:transparent; border-color:var(--border-strong); color:var(--text-primary);}
.btn-outline:hover{background:var(--surface-hover); border-color:var(--navy-border);}
.btn-ghost{background:transparent; color:var(--text-secondary); height:40px; padding:0 12px;}
.btn-logout{background:var(--error-tint); border:1px solid var(--error-border); color:var(--error);} /* acción destructiva/salida */
```

### Badges, pills y chips
```css
.status-pill{display:flex; align-items:center; gap:8px; background:var(--surface-alt); border:1px solid var(--border); border-radius:var(--radius-pill); padding:6px 14px; font-size:12.5px; font-weight:700; color:var(--text-secondary);}
.eyebrow{display:inline-flex; background:var(--navy-tint); border:1px solid var(--navy-border); color:var(--navy); font-size:12px; font-weight:700; padding:5px 12px; border-radius:var(--radius-pill);}
.chip{height:40px; padding:0 16px; border-radius:var(--radius-pill); border:1px solid transparent; color:var(--text-secondary); font-weight:700; font-size:13.5px; display:flex; align-items:center; gap:7px;}
.chip.active{background:var(--surface); border-color:var(--border-strong); color:var(--text-primary); box-shadow:0 1px 2px rgba(20,25,15,0.06);}
```

### Tarjetas y superficies
```css
.card-base{background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); transition:border-color .15s ease, transform .15s ease;}
.card-base:hover{border-color:var(--border-strong); transform:translateY(-2px);} /* solo en tarjetas clicables, no en filas de lista */
```

### Avatar / ícono con tinte
```css
.avatar{width:40px; height:40px; border-radius:50%; background:var(--surface-alt); display:flex; align-items:center; justify-content:center; font-family:var(--font-head); font-weight:700; border:2px solid var(--ring, var(--border-strong));}
.icon-tinted{width:40px; height:40px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; background:var(--icon-tint); color:var(--icon-color); border:1px solid var(--border);}
```
`--ring`, `--icon-tint`, `--icon-color` se setean **inline por elemento** según el rol/categoría (mismo patrón en las tres pantallas).

### Banners (4 variantes fijas)
```css
.banner{display:flex; gap:12px; background:var(--surface); border:1px solid var(--border); border-left:3px solid; border-radius:var(--radius-md); padding:13px 15px; font-size:14px;}
.banner-success{border-left-color:var(--grass-deep);} .banner-error{border-left-color:var(--error);}
.banner-warning{border-left-color:var(--warning);} .banner-info{border-left-color:var(--navy);}
```

### Header sticky (HUD) — dos variantes
- **Con buscador** (pantallas de lista): logo + buscador flexible + CTA principal. Ver `.hud` en `gestion-miembros-v4-claro.html`.
- **Simple** (dashboards): logo + status pill + acción secundaria. Ver `.hud` en `panel-control-v4-claro.html`.
- **Con instrumento** (captura en vivo): logo + marcador/reloj + acciones ghost. Ver `.hud` en `carga-en-vivo-v4-claro.html`.

Las tres comparten: `position:sticky; top:0`, fondo `rgba(246,247,241,0.88–0.9)` con `backdrop-filter:blur(10px)`, borde inferior `1px solid var(--border)`.

---

## 4. Componentes específicos por patrón

Estos **no** son de uso universal — se toman del mockup correspondiente solo cuando la pantalla nueva es de ese tipo.

- **Patrón lista** (`gestion-miembros-v4-claro.html`): `.member-row`, `.role-btn` + `.role-menu` (dropdown a medida, no `<select>` nativo), `.perm-icon` (permiso vía banner, no tooltip hover), `.actions-menu` ("···"), `.status-badge`, `.batch-bar` (guardado en lote, sin botón "Guardar" por fila), skeleton/empty state.
- **Patrón dashboard** (`panel-control-v4-claro.html`): `.module-card`, `.module-icon` + `.module-tag` (color según categoría: verde=en vivo, azul marino=admin, azul medio=staff), `.module-link` con flecha animada al hover.
- **Patrón grilla densa** (`carga-en-vivo-v4-claro.html`): `.ev-btn` (4 variantes: `outline-grass`, `solid-blue`, `outline-error`, `outline-warning`), `.clock-chip` (instrumento oscuro sobre fondo claro), `.rail-num`, `.historial-item`, `.possession-bar`.

---

## 5. Estados e interacción (aplican siempre que el componente exista)

1. Un solo popover abierto a la vez (rol, acciones, o cualquier menú futuro).
2. `is-dirty` / cambios pendientes se marcan con borde izquierdo `var(--grass)`, nunca se autoguardan.
3. Ícono de permiso o de ayuda = botón táctil que dispara un banner `info`, no un `title`/tooltip por hover (no funciona en tablet).
4. Conteos en chips/filtros siempre calculados en vivo, nunca hardcodeados.
5. `:focus-visible` con outline `var(--navy)` en todo elemento interactivo — no quitar el foco por estética.

## 6. Breakpoints
```css
@media (max-width:980px){ /* grillas densas: colapsan a 1–2 columnas, ocultar rails decorativos */ }
@media (max-width:820px){ /* filas de lista: pasan a columna única */ }
@media (max-width:760px){ /* header: padding reducido, título más chico */ }
```

---

## 7. ¿Dónde va esto en el repo y cómo se referencia desde `AGENTS.md`?

**No lo seas pegues entero dentro de `AGENTS.md`.** `AGENTS.md`/`CLAUDE.md` están para cómo correr y construir el proyecto (Docker, comandos, convenciones de código); mezclarlo con la especificación visual completa lo hace más largo y más difícil de mantener — cada vez que ajustes un color tendrías que tocar el archivo que el agente lee para todo lo demás.

Lo que sí conviene:

1. Guardar este documento como `frontend/DESIGN_SYSTEM.md` (vive junto al código que lo implementa).
2. Guardar los tres HTML de referencia en `frontend/design-reference/` (o `mocks/`), versionados en el repo — no como adjuntos sueltos.
3. Agregar **una sección corta** en `AGENTS.md` (y en `CLAUDE.md`, ya que mantenés ambos sincronizados) que apunte ahí:

```markdown
## Frontend — Sistema visual

Toda pantalla nueva o modificada del frontend debe seguir `frontend/DESIGN_SYSTEM.md`:
tokens de color/tipografía fijos (no crear colores nuevos), y el patrón de layout
más parecido entre los tres de referencia en `frontend/design-reference/`:
- Lista/gestión → `gestion-miembros-v4-claro.html`
- Dashboard/selector → `panel-control-v4-claro.html`
- Grilla de acciones densa → `carga-en-vivo-v4-claro.html`

Si ninguno encaja, combinar los componentes base de la sección 3 del sistema de
diseño. No introducir sombras pesadas, radios distintos, ni un color fuera de la
paleta sin actualizar primero `DESIGN_SYSTEM.md`.
```

Así el agente lee `AGENTS.md` primero (como siempre), y ese archivo lo redirige al detalle solo cuando la tarea es de frontend/estilo — el resto de las tareas (backend, tests) no cargan contexto visual que no necesitan.

---

## 8. Sobre el prompt "usar members-list como maqueta para todo"

**No te lo recomiendo tal cual lo planteás**, y por eso no te lo doy: `gestion-miembros-v4-claro.html` es el patrón **lista**. Si tu agente lo usa como maqueta única para, por ejemplo, el dashboard o la pantalla de captura en vivo, terminaría forzando filas de tabla y un buscador donde en realidad va una grilla de tarjetas o una grilla de botones grandes — mismo problema de fondo que ya resolvimos acá (drift entre pantallas), pero ahora por sobre-generalizar en vez de por sub-especificar.

Con la guía actualizada (sección 4, tabla de arriba) alcanza: le decís al agente qué patrón corresponde y a qué archivo mirar. Si igual querés un prompt corto para pegarle cuando le pidas una pantalla nueva, este cubre el caso general sin forzar un solo componente:

```
Implementá [nombre de la pantalla] siguiendo frontend/DESIGN_SYSTEM.md.
Usá los tokens de :root tal cual están, sin crear colores, radios ni sombras nuevos.
Esta pantalla se parece más al patrón [lista / dashboard / grilla de acciones] —
tomá frontend/design-reference/[archivo correspondiente].html como referencia visual
y de componentes, pero adaptá el layout al contenido real de esta pantalla en vez
de forzar el de la referencia.
```

Solo la parte entre corchetes cambia por pantalla.
