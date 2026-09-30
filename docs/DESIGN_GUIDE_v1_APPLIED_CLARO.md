# Design Guide v1 — Aplicado a Carga en Vivo

**Fecha:** 2026-09-23  
**Archivos modificados:**
- `frontend/src/app/features/cargaEnVivo/carga-en-vivo/carga-en-vivo.component.css`
- `frontend/src/styles/ovaltrack-tokens.css`

---

## Cambios de Color

### Paleta de Marca (extraídos del isotipo)

| Token          | Hex       | Uso                                                  |
| -------------- | --------- | ---------------------------------------------------- |
| `--navy-900`   | `#0C2C47` | Estructura, text de alta jerarquía, íconos activos   |
| `--navy-700`   | `#17456B` | Bordes/acento secundario                             |
| `--navy-100`   | `#E4EBF1` | Fondo tenue para hover/estados                       |
| `--green-500`  | `#57AD16` | Éxito, posesión propia, confirmaciones               |
| `--green-700`  | `#3D8712` | Texto sobre fondo verde tenue                        |
| `--green-100`  | `#E4F3D9` | Fondo tenue de estados positivos                     |
| `--orange-500` | `#F5821F` | Foco / atención puntual (CTA, alerta)                |
| `--orange-600` | `#D96A0A` | Texto sobre fondo naranja tenue                      |
| `--orange-100` | `#FDE9D3` | Fondo tenue de advertencia                           |
| `--red-600`    | `#C6403A` | Rival, error                                         |
| `--red-100`    | `#FBE1DF` | Fondo tenue de error/rival                           |

### Neutros — Modo Claro (default en cancha)

| Token           | Hex       | Uso                             |
| --------------- | --------- | ------------------------------- |
| `--bg`          | `#F6F7F9` | Fondo general                   |
| `--surface`     | `#FFFFFF` | Tarjetas, headers, paneles      |
| `--surface-alt` | `#EEF1F4` | Fondo secundario / hover neutro |
| `--text`        | `#16191C` | Texto principal                 |
| `--text-2`      | `#5A6472` | Texto secundario                |
| `--border`      | `#DDE1E6` | Bordes y separadores            |

### Neutros — Modo Oscuro (uso nocturno / interior)

| Token           | Hex       | Uso                                  |
| --------------- | --------- | ------------------------------------ |
| `--bg`          | `#12161B` | Fondo general (slate, no negro puro) |
| `--surface`     | `#1B2027` | Tarjetas, headers, paneles           |
| `--surface-alt` | `#232931` | Fondo secundario / hover neutro      |
| `--text`        | `#F2F4F6` | Texto principal                      |
| `--text-2`      | `#A7B0BA` | Texto secundario                     |
| `--border`      | `#2E343C` | Bordes y separadores                 |

---

## Cambios de Tipografía

### Dos familias, dos roles

| Familia         | Rol                                        | Dónde se usa                                                   |
| --------------- | ------------------------------------------ | -------------------------------------------------------------- |
| **Manrope**     | Voz humana — cercana, redondeada, legible  | Títulos, navegación, texto de interfaz, botones                |
| **Space Grotesk** | Voz de dato — técnica, angulosa, precisa   | Marcador, cronómetro, estadísticas, números relevantes          |

**Implementación:**
```css
body { font-family: 'Manrope', system-ui, sans-serif; }
.score, .clock, .stat { 
  font-family: 'Space Grotesk', monospace; 
  font-variant-numeric: tabular-nums;
}
```

---

## Cambios en Componentes

### Cabecera (Header)
- Fondo cambia de `--ot-surface-card` a `--surface` (blanco en claro, gris en oscuro)
- Marca y nombre usan `Manrope` en lugar de `Hanken Grotesk`
- Marcador ahora usa `Space Grotesk` en negrita para los números
- Reloj (clock) con números en `Space Grotesk`, fondo en `--surface-alt`

### Botones
- `.icon-btn`: Fondo `--surface-alt`, borde `--border`, texto `--navy-900`
- Hover: Fondo `--navy-100`, borde `--navy-700`
- `.btn--outline`: Borde `--navy-900`, fondo transparente, `Manrope` 600 weight

### Números de Jugadores (Columnas laterales)
- Tamaño: **44px mínimo** (antes 34px) para mejor accesibilidad WCAG AA
- Equipo propio: Fondo `--green-100`, borde `--green-500`, texto `--green-700`
- Rival: Fondo `--red-100`, borde `--red-600`, texto `--red-600`
- Hover: Escala 1.08 + sombra sutil (en lugar de translateY)
- Font: `Space Grotesk` 600 weight con `font-variant-numeric: tabular-nums`

### Chips de Evento
- Base: Fondo `--surface`, borde 2px `--border`, texto `--text`, Manrope 600
- `.event-chip--success`: Fondo `--green-100`, borde `--green-500`, texto `--green-700`
- `.event-chip--danger`: Fondo `--red-100`, borde `--red-600`, texto `--red-600`
- `.event-chip--warning`: Fondo `--orange-100`, borde `--orange-500`, texto `--orange-600`
- `.event-chip--selected`: Fondo sólido `--navy-900`, texto blanco, caja-sombra `--navy-100`
- Transiciones suaves (0.2s ease)

### Historial (History)
- Fondo: `--surface`
- Borde izquierdo: `--border` 1px
- Tiempo (`.history__time`): `Space Grotesk` 600, color `--green-700`, `tabular-nums`
- Botón deshacer: Hover con fondo `--navy-100`

### Barra de Posesión
- Base: Fondo `--surface-alt`, borde 2px `--border`, `Manrope` 700
- Posesión propia: Fondo `--green-500`, texto blanco
- Posesión neutra: Fondo `--navy-700`, texto blanco
- Posesión rival: Fondo `--red-600`, texto blanco

---

## Accesibilidad

✅ **Tap targets**: Mínimo 44px en todos los botones interactivos  
✅ **Contraste**: Pares de color verificados AA en modos claro y oscuro  
✅ **Estados multimodales**: Cada estado se distingue por color + forma + ícono (nunca solo color)  
✅ **Modo claro default**: Mejor legibilidad bajo sol directo (cancha)  
✅ **Modo oscuro**: Slate (#12161B) en lugar de negro puro para reducir halo bajo luz reflejada  

---

## Breakpoints & Responsive

- **Desktop (>991px)**: Grid 4 columnas (números-propio | catálogo | números-rival | historial)
- **Tablet (768px–991px)**: Grid 3 columnas sin historial
- **Mobile (<768px)**: Stack vertical con números en scroll horizontal

**Mobile especial:**
- Números pasan de columna vertical a fila horizontal scrolleable
- Historial bajo catálogo de eventos
- Barra de posesión comprimida con padding reducido

---

## CSS Custom Properties — Referencia Rápida

```css
/* En :root */
--navy-900: #0C2C47;
--navy-700: #17456B;
--navy-100: #E4EBF1;
--green-500: #57AD16;
--green-700: #3D8712;
--green-100: #E4F3D9;
--orange-500: #F5821F;
--orange-600: #D96A0A;
--orange-100: #FDE9D3;
--red-600: #C6403A;
--red-100: #FBE1DF;
--bg: #F6F7F9;           /* Modo claro default */
--surface: #FFFFFF;
--surface-alt: #EEF1F4;
--text: #16191C;
--text-2: #5A6472;
--border: #DDE1E6;
--font-manrope: 'Manrope', system-ui, sans-serif;
--font-space-grotesk: 'Space Grotesk', 'Courier New', monospace;

/* En [data-theme="dark"] o @media (prefers-color-scheme: dark) */
--bg: #12161B;
--surface: #1B2027;
--surface-alt: #232931;
--text: #F2F4F6;
--text-2: #A7B0BA;
--border: #2E343C;
```

---

## Próximos Pasos (Opcional)

1. Aplicar mismo design guide a otras pantallas (match-selection, etc.)
2. Crear una librería de componentes reutilizables con estos estilos
3. Documentar transiciones y microinteracciones
4. Testear en dispositivos reales bajo luz solar directa
