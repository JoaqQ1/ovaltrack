---
name: OvalTrack Kinetic System
colors:
  surface: '#10150b'
  surface-dim: '#10150b'
  surface-bright: '#363b2f'
  surface-container-lowest: '#0b1007'
  surface-container-low: '#181d13'
  surface-container: '#1c2117'
  surface-container-high: '#272c21'
  surface-container-highest: '#32362b'
  on-surface: '#e0e4d4'
  on-surface-variant: '#c1cab2'
  inverse-surface: '#e0e4d4'
  inverse-on-surface: '#2d3227'
  outline: '#8b947e'
  outline-variant: '#414937'
  surface-tint: '#91da40'
  primary: '#91da40'
  on-primary: '#1d3700'
  primary-container: '#76bc21'
  on-primary-container: '#274600'
  inverse-primary: '#3d6a00'
  secondary: '#b0c8eb'
  on-secondary: '#19324d'
  secondary-container: '#314865'
  on-secondary-container: '#9fb7d9'
  tertiary: '#ffb785'
  on-tertiary: '#502400'
  tertiary-container: '#ff8b2a'
  on-tertiary-container: '#653000'
  error: '#F04438'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acf75a'
  primary-fixed-dim: '#91da40'
  on-primary-fixed: '#0f2000'
  on-primary-fixed-variant: '#2d5000'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#b0c8eb'
  on-secondary-fixed: '#001c37'
  on-secondary-fixed-variant: '#314865'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb785'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#723700'
  background: '#10150b'
  on-background: '#e0e4d4'
  surface-variant: '#32362b'
  possession-own: '#76BC21'
  possession-rival: '#E1E8ED'
  possession-neutral: '#475467'
  success: '#32D583'
  warning: '#FDB022'
  background-deep: '#051320'
  surface-card: '#0F2E4A'
typography:
  display-clock:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-clock-mobile:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 48px
  gutter-match: 1rem
  margin-screen: 1.5rem
  stack-compact: 0.5rem
  stack-default: 1rem
---

## Brand & Style

This design system is built for the high-pressure environment of live rugby performance analysis. The brand personality is **technical, rugged, and precise**, bridging the gap between the physical intensity of the pitch and the cold accuracy of data science. It is designed to be "Amateur Professional"—providing elite-level tools to local clubs with a focus on speed of entry and immediate utility.

The aesthetic follows a **Corporate / Modern** approach with **High-Contrast** functional elements. It prioritizes legibility under direct sunlight (outdoor use) and rapid tactile interaction. Visual cues are inspired by "sport-tech" instrumentation: clear telemetry, high-visibility status indicators, and a performance-driven layout that minimizes cognitive load during a match. The "From Match to Data" vision is realized through a seamless transition from expressive, energetic branding to a structured, systematic data environment.

## Colors

The palette is optimized for a **Dark Mode** default to combat screen glare and provide a high-contrast foundation for the vibrant brand colors.

- **Primary (Vibrant Green):** Used for "Success," "Own Possession," and active primary actions. It represents energy and field presence.
- **Secondary (Dark Navy):** The structural base. It provides a professional, stable background that recedes, allowing data points to pop.
- **Tertiary (Orange Accent):** Reserved for critical data highlights, "Turnovers," and high-priority alerts.
- **Semantic Logic:**
    - **Possession:** Must be signaled via a persistent top-level bar. Own team uses the Primary Green; Rivals use a high-contrast Neutral Light Gray.
    - **Status:** Sync states (Online/Offline) use Success/Warning/Error tokens to ensure the analyst is always aware of data integrity.

## Typography

Typography is a functional tool in this design system. We employ a tri-font strategy:

1. **Hanken Grotesk (Headlines):** A sharp, contemporary sans-serif used for impactful branding and section titles.
2. **Inter (UI/Body):** Chosen for its exceptional legibility and neutral tone, used for player lists, event catalogs, and general navigation.
3. **JetBrains Mono (Data/Clocks):** A monospaced font used for the Match Clock and continuous timestamps. This ensures that numbers do not "jump" as they change, maintaining visual stability during high-speed tracking.

**Outdoor Legibility:** Font weights are bumped higher than standard web apps (e.g., using 500 instead of 400 for body) to ensure characters remain crisp in high-brightness environments.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model optimized for the "3-Tap Rule." Every critical action must be reachable within three taps.

- **Grid Strategy:** A 12-column system for Desktop/Laptop, reflowing to a single or double column for Tablet. The Live Capture screen uses a split-pane layout: Event Catalog (Left) and Player Selection (Right).
- **Touch-First:** All interactive elements respect a minimum 48px hit target. Gutters are kept at 16px to prevent accidental taps between buttons while maintaining a dense enough layout for expert analysts to work quickly.
- **Breakpoints:**
    - **Mobile/Handheld:** Primarily for Player/Coach viewing of reports.
    - **Tablet (Primary):** The main capture environment. Focuses on horizontal density.
    - **Desktop/Laptop:** Advanced administration and deep-dive data visualization.

## Elevation & Depth

To maximize performance on PWAs and visibility in sunlight, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-contrast Outlines**.

- **Surface Tiers:** The background uses `background-deep`. Cards and interactive containers use `surface-card`, creating a subtle lift through color value rather than drop shadows.
- **Active States:** Elements being "tapped" or "active" (like a selected player) should use a 2px inner border of the Primary Green rather than an elevation change.
- **Persistent HUD:** The Match Clock and Possession bar are fixed to the top of the viewport with a slight backdrop blur (10px) to maintain legibility over scrolling content without introducing heavy visual weight.

## Shapes

The shape language is **Soft (Level 1)**. This provides a professional, "tooled" look that feels technical rather than playful. 

- **Standard Elements:** 4px radius (`0.25rem`). This applies to input fields, list items, and smaller utility buttons.
- **Primary Action Buttons:** Use the `rounded-lg` (8px) setting to make them feel more distinct and "clickable" in high-intensity moments.
- **Data Visuals:** Charts and bars should have 0px or very minimal rounding to maintain the "precision instrument" feel.

## Components

- **Action Buttons:** Large, high-contrast blocks. The "Undo" button is a persistent secondary action with a clear border to prevent accidental data loss.
- **Event Chips:** Categorical chips for "Tackle," "Turnover," etc. Successful actions use a green outline; failures use a subtle red tint.
- **Possession Toggle:** A prominent, two-state segmented control at the top of the logging screen. It serves as a global filter for all following events.
- **Match Clock Component:** Large monospaced display. The "Pause" button is the largest secondary target to allow the analyst to sync with referee whistles instantly.
- **Player Grid:** High-density list with large photos or jersey numbers. Selected players are highlighted with a high-visibility Primary Green ring.
- **Sync Status Indicator:** A small, persistent icon (Cloud/Offline) in the navigation bar that changes color based on `success` (synced), `warning` (offline/local storage), or `error` (sync failed).