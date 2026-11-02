export type Rgb = readonly [number, number, number];

export const WCAG_AA_TEXT_CONTRAST = 4.5;

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16)) as unknown as Rgb;
}

/** Mezcla `top` sobre `bottom` con la opacidad `alpha` (0–1), como lo hace el navegador al pintar. */
export function blend(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return top.map((channel, i) => channel * alpha + bottom[i] * (1 - alpha)) as unknown as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Relación de contraste WCAG 2.x entre dos colores (1–21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}
