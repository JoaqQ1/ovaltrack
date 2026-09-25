# OvalTrack — Sistema de Diseño Oficial (Design System)

> **Estado:** Activo y alineado al 100% con la interfaz del frontend.  
> **Identidad Visual:** *Sport Pro Salvia & Dark Rugby Tech* (Estética deportiva de alto rendimiento, contrastes tácticos y elevación física).

Este documento es la **fuente de verdad definitiva y obligatoria** para el diseño y desarrollo de todas las vistas del frontend de OvalTrack. Cualquier componente o pantalla nueva debe construirse respetando los tokens, patrones y lineamientos aquí descritos.

---

## 1. Tokens de Color Globales (`:root`) — Diseño Actual Activo

Los tokens oficiales del sistema corresponden a la identidad visual **Sport Pro Salvia** actualmente implementada en el frontend.

### 1.1 Paleta Activa (Modo Claro Deportivo — Vistas de Gestión)

```css
:root {
  /* Lienzo y Fondo de Cancha */
  --bg: #f6f7f1;
  --bg-canvas: #e1edde;                       /* Fondo base verde salvia deportivo suave (luminoso hacia blanco) */
  --bg-canvas-pattern: rgba(55, 75, 60, 0.14); /* Líneas tácticas a 135deg */

  /* Superficies y Tarjetas Elevadas */
  --surface: #ffffff;                         /* Tarjetas principales, modales y tablas */
  --surface-alt: #eef1e7;                     /* Fondos secundarios, chips y segmentos */
  --surface-hover: #f1f3ea;                   /* Estados hover en filas y botones */
  --surface-header-start: #edf5e9;            /* Degradado superior cabecera tarjeta */
  --surface-header-end: #e0ebd8;              /* Degradado inferior cabecera tarjeta */
  --surface-toolbar: #eaf3e6;                 /* Barra de filtros segmentada */

  /* Bordes de Elevación Deportiva */
  --border: rgba(27, 33, 22, 0.10);          /* Separadores y bordes sutiles */
  --border-strong: rgba(27, 33, 22, 0.22);   /* Bordes de inputs e interacción */
  --border-sport: rgba(32, 75, 34, 0.28);    /* Borde firme 2px en tarjetas y modales */
  --border-sport-subtle: rgba(32, 75, 34, 0.20); /* Separadores internos de tarjetas */

  /* Textos y Tipografías */
  --text-primary: #111d0e;                   /* Títulos y textos de alto contraste */
  --text-secondary: #3b4e33;                 /* Subtítulos, descripciones y labels */
  --text-muted: #7a8c74;                     /* Placeholders y contadores */

  /* Colores de Acento y Acción */
  --btn-primary-bg: #204b22;                 /* Verde rugby botella (CTA principal) */
  --btn-primary-fg: #ffffff;                 /* Texto blanco sobre verde botella */
  --btn-primary-hover: #163618;              /* Hover de acción principal */
  --btn-outline-bg: #ffffff;                 /* Fondo botón secundario */
  --btn-outline-border: rgba(32, 75, 34, 0.25);
  --btn-outline-fg: #204b22;

  /* Semántica de Roles y Estados */
  --navy: #16324f;                           /* Identidad Admin Club / Foco */
  --navy-tint: rgba(22, 50, 79, 0.08);
  --navy-border: rgba(22, 50, 79, 0.30);
  --blue-mid: #2b6ca3;                       /* Identidad Coach / Analista */
  --blue-mid-tint: rgba(43, 108, 163, 0.08);
  --player: #6b6f5f;                         /* Identidad Jugador / Neutro */
  --player-tint: rgba(20, 25, 15, 0.05);

  /* Feedback y Alertas */
  --success: #2e7d32;
  --success-tint: rgba(46, 125, 50, 0.12);
  --warning: #8a5700;
  --warning-tint: rgba(253, 176, 34, 0.20);
  --error: #b42318;
  --error-tint: rgba(240, 68, 56, 0.14);
  --error-border: rgba(180, 35, 24, 0.35);

  /* Geometría y Sombras */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;
  --shadow-elevation: 0 16px 36px rgba(15, 35, 15, 0.12), 0 4px 12px rgba(15, 35, 15, 0.06);
  --shadow-button: 0 4px 12px rgba(32, 75, 34, 0.20);
  --shadow-button-hover: 0 6px 16px rgba(32, 75, 34, 0.28);
}
```

---

## 2. Tipografía

El sistema utiliza tres familias tipográficas de Google Fonts cargadas globalmente:

```html
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
```

| Familia | Pesos | Uso principal |
|---|---|---|
| **Hanken Grotesk** (`--font-head`) | 700, 800 | Títulos de página (HUD), encabezados de tarjetas, títulos de modales y logos. |
| **Inter** (`--font-body`) | 400, 500, 600, 700 | Textos de interfaz, inputs, tablas, botones, descripciones y badges. |
| **JetBrains Mono** (`--font-mono`) | 500, 600, 700 | Dorsales, emails, contadores, timestamps y datos numéricos/estadísticos. |

---

## 3. Componentes Base Globales

### 3.1 Fondo de Cancha Salvia Deportivo
El fondo global de las pantallas de gestión aplica un lienzo verde salvia suave y luminoso `#e1edde` con líneas tácticas diagonales sutiles:

```css
body {
  background-color: #e1edde;
  background-image: 
    radial-gradient(ellipse at 50% 30%, rgba(225, 237, 222, 0.92) 0%, rgba(225, 237, 222, 0.65) 35%, rgba(225, 237, 222, 0.15) 65%, transparent 80%),
    repeating-linear-gradient(135deg, rgba(55, 75, 60, 0.14) 0px, rgba(55, 75, 60, 0.14) 1.5px, transparent 1.5px, transparent 54px);
  background-attachment: fixed;
  color: #1b2116;
  font-family: var(--font-body);
}
```

### 3.2 Page Header (HUD Integrado)
Cabecera estática superior (sin efecto glassmorphism flotante ni fondos oscuros pesados) que unifica el título y la acción principal:

```html
<header class="hud">
  <div class="hud-brand">
    <div class="badge-tech">
      <span>Categorías & Planteles</span>
    </div>
    <div class="brand-text">
      <h1 class="title">Divisiones & Planteles</h1>
      <p class="club">Administra las categorías competitivas y planteles activos</p>
    </div>
  </div>

  <div class="hud-actions">
    <button type="button" class="btn btn-invite">+ Nueva División</button>
  </div>
</header>
```

- `.badge-tech`: Píldora en fondo `#d6eac0`, borde `1px solid rgba(36, 76, 9, 0.25)` y texto `#244c09`.
- `.title`: Tipografía `Hanken Grotesk` 800, tamaño `2rem` (32px), color `#111d0e`.
- `.club`: Tamaño `14px`, peso 500, color `#3b4e33`.

### 3.3 Botones

```css
/* Botón de Acción Principal (CTA Rugby) */
.btn-invite, .btn-primary-rugby {
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  background-color: #204b22;
  color: #ffffff;
  font-weight: 700;
  border: 1px solid #204b22;
  box-shadow: 0 4px 12px rgba(32, 75, 34, 0.20);
  transition: all 0.15s ease;
}
.btn-invite:hover {
  background-color: #163618;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(32, 75, 34, 0.28);
}

/* Botón Secundario / Outline Deportivo */
.btn-outline {
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  background-color: #ffffff;
  border: 1px solid rgba(32, 75, 34, 0.25);
  color: #204b22;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(20, 45, 20, 0.04);
}
.btn-outline:hover {
  background-color: #f2f7ef;
  border-color: #204b22;
  color: #142e15;
  transform: translateY(-1px);
}
```

### 3.4 Tarjetas Elevadas de Formulario y Contenido (`.form-card`, `.match-card-shell`, etc.)
Estructura en dos capas con cabecera en degradé suave y cuerpo blanco puro con bordes de 2px:

```css
.form-card {
  background: #ffffff;
  border: 2px solid rgba(32, 75, 34, 0.28);
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(15, 35, 15, 0.12), 0 4px 12px rgba(15, 35, 15, 0.06);
  overflow: hidden;
}

.form-card-header {
  background: linear-gradient(180deg, #edf5e9 0%, #e0ebd8 100%);
  border-bottom: 2px solid rgba(32, 75, 34, 0.20);
  padding: 24px 32px 20px;
}

.form-card-title {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 20px;
  color: #111d0e;
}
```

### 3.5 Controles de Formulario (`.form-control`)
Inputs y selects con altura táctil accesible (46px), bordes salvia y foco verde bosque:

```css
.form-control {
  width: 100%;
  height: 46px;
  background: #ffffff;
  border: 1px solid rgba(32, 75, 34, 0.22);
  border-radius: 10px;
  color: #111d0e;
  padding: 0 14px;
  font-size: 14.5px;
}
.form-control:focus {
  border-color: #204b22;
  box-shadow: 0 0 0 3px rgba(32, 75, 34, 0.15);
  background: #fafdf9;
}
```

---

## 4. Patrones de Pantalla Implementados

### 4.1 Barra de Navegación Global (`NavbarComponent`)
- **Posición:** `sticky-top` con `z-index: 1030`.
- **Soporte de Tema Dual:**
  - *Modo Oscuro:* Fondo `#0b111e`, borde `#1f2e47`, textos blancos, botón neón `#a3e635`.
  - *Modo Claro:* Fondo `#e1edde`, borde inferior `2px solid #204b22`, sombra suave, botón de acción en verde rugby `#204b22`.
- **Elementos Clave:**
  - Isotipo dinámico con la inicial del club (o 'O' por defecto).
  - Título del club actual reactivo vía `UserContextService`.
  - Toggle de tema con ícono Sol / Luna.
  - Botón inteligente `Volver al inicio` (visible únicamente cuando `currentUrl !== '/home'`).
  - Badge de rol de usuario autenticado (`ADMIN_CLUB`, `COACH_ANALYST`, etc.).
  - Botón de cierre de sesión con acento seguro.

### 4.2 Autenticación Split-Screen Pro Deportivo (`/login` y `/auth/register`)
- **Columna Izquierda (Hero de Alto Impacto):**
  - Fondo oscuro con gradiente deportivo, tramado sutil e iluminación radial verde neón.
  - Badge tech brillante `"ALTO RENDIMIENTO EN RUGBY"`.
  - Título enfático: `"Eleva la gestión de tu club al siguiente nivel"`.
  - Tarjetas flotantes de métricas en vivo (Scrum efficiency, Live tagging, etc.).
- **Columna Derecha (Formulario Flotante):**
  - Botón flotante superior `← Volver a la portada`.
  - Tarjeta de formulario con bordes firmes, soporte reactivo para tema Claro/Oscuro.
  - Tabs de selección de rol (Administrador de Club vs. Entrenador / Analista).
  - Todos los campos de validación requeridos intactos.

### 4.3 Mi Club (`/club`)
- **Modo Lectura por Defecto:**
  - Hero card con logo del club, nombre en grande, ciudad, dirección y fecha de fundación.
  - Tarjetas de información organizadas en grid (2px borders, headers en degradé salvia).
  - Botón de activación: `✏️ Editar información`.
- **Modo Edición Condicional:**
  - Clona un borrador independiente (`clubDraft`) sin mutar el estado global hasta guardar.
  - Inputs editables con focus verde rugby y feedback de validación.
  - Botones de acción `Cancelar` y `Guardar cambios`.
  - Sincronización instantánea con el `UserContextService` y la barra de navegación global al guardar.

### 4.4 Listados y Tablas de Planteles (`/divisions/:id/players`, `/divisions/:id/coaches`, `/members`)
- **Cabeceras de Tabla Salvia:** Fondo `#edf5e9`, borde `2px solid rgba(32, 75, 34, 0.20)`, títulos en uppercase y tracking deportivo.
- **Filas Elevadas:** Fondo blanco `#ffffff`, hover `#f1f3ea`, borde inferior sutil.
- **Avatares de Iniciales:** Círculos de 40px con borde de rol específico (Navy para Admin, Blue para Coach, Salvia para Jugador).
- **Selector de Rol Personalizado:** Popover dropdown a medida (no `<select>` nativo del navegador).
- **Barra de Guardado en Lote (`.batch-bar`):** Flotante en la parte inferior cuando existen cambios sin persistir (`is-dirty`).

### 4.5 Fixture y Selección de Partidos (`/match-selection`)
- **Toolbar de Filtros:** Contenedor en `#eaf3e6` con pestañas segmentadas redondeadas (Todos, Por Jugar, En Curso, Finalizados, Cancelados).
- **Tarjetas de Partidos (`.match-card-shell`):**
  - Badge de estado con indicador luminoso pulsante para partidos `in_progress`.
  - Sección central con tipografía destacada de rival `"VS CLUB_OPONENTE"`.
  - Badges de fecha y marcador parcial/final con tipografía JetBrains Mono.
  - Botón de eliminación discreto en la esquina superior.
  - Acción contextual en pie de tarjeta (`Definir alineación →`, `Capturar en vivo →`, `Ver resumen →`).

### 4.6 Captura en Vivo (`/live-capture/:matchId`)
- **Entorno Especializado de Cancha:** Interfaz de alto contraste, táctil (hit-target mínimo de 48px), optimizada para tablets en tiempo real.
- **Marcador e Instrumentos:** Cronómetro de partido y marcador en `Space Grotesk` / `JetBrains Mono`.
- **Aislamiento:** No incluye la barra de navegación estándar para maximizar el área de control e impedir clics accidentales durante el juego.

---

## 5. Escalabilidad y Futura Incorporación del Modo Oscuro

Actualmente, las vistas de gestión del club, divisiones, planteles y fixture operan bajo el **Modo Claro Deportivo (*Sport Salvia*)** como diseño base oficial y aprobado.

Cuando decidas abordar y definir el **Modo Oscuro** para estas vistas en una etapa futura, el flujo de trabajo será el siguiente:

### Pasos para cuando definas el Modo Oscuro:

1. **Definir la paleta visual oscura**: Se eligen los tonos exactos (fondos oscuros, contraste de tarjetas, colores de texto y acento de botones).
2. **Actualizar este documento (`DESIGN_SYSTEM.md`)**: Se agrega la sección oficial de tokens de Modo Oscuro con los valores aprobados.
3. **Mapear los tokens en `frontend/src/styles.css` bajo `[data-theme="dark"]`**:
   ```css
   [data-theme="dark"] {
     --color-bg-canvas: [color-fondo-definido];
     --color-surface-card: [color-tarjetas-definido];
     --color-text-title: [color-titulos-definido];
     --color-btn-primary-bg: [color-cta-definido];
   }
   ```
4. **Reutilizar los componentes sin reescribir HTML**: Como la arquitectura ya utiliza `ThemeService` y las clases globales (`.form-card`, `.btn-invite`, `.hud`), todo el sistema se adaptará al nuevo modo oscuro de forma limpia y mantenible.

---

## 6. Reglas de Oro para Desarrolladores y Agentes

1. **Nunca inventar colores ni sombras:** Usar estrictamente los tokens definidos en este sistema.
2. **Respetar la jerarquía visual de botones:**
   - Verde Rugby / Botella (`#204b22` o `--btn-invite`): Únicamente para la acción principal más importante de la pantalla.
   - Outline Blanco Deportivo (`.btn-outline`): Para acciones secundarias, filtros o cancelar.
   - Rojo destructivo (`.btn-logout`, `.btn-delete`): Reservado para eliminar o cerrar sesión.
3. **Mantener la consistencia de elevación:** Toda tarjeta, tabla o contenedor de datos debe tener borde de `2px` con radio redondeado (`16px` o `20px`) y sombra de elevación profunda.
4. **Hit-targets mínimos de 44px a 48px:** Toda área interactiva debe ser fácilmente clickeable en tablet y móvil.
5. **No romper la pantalla de Carga en Vivo (`/live-capture/:matchId`):** Dicha pantalla es un instrumento de captura en tiempo real y debe mantenerse enfocada en su diseño de alta densidad.
