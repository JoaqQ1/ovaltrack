/**
 * Calcula un porcentaje de forma segura, evitando división por cero y redondeando
 * a la cantidad de decimales especificada (por defecto 1 decimal).
 *
 * @param part Valor parcial (numerador).
 * @param total Valor total (denominador).
 * @param fallback Valor de retorno cuando total es <= 0 (por defecto 0.0).
 * @param decimals Cantidad de decimales de precisión para el redondeo (por defecto 1).
 * @returns Porcentaje redondeado a `decimals` cifras decimales.
 */
export function calculatePercentage(
  part: number,
  total: number,
  fallback = 0.0,
  decimals = 1
): number {
  if (total <= 0) {
    return fallback;
  }
  const factor = 10 ** decimals;
  return Math.round(((part / total) * 100) * factor) / factor;
}
