/**
 * El atributo `zone` del catálogo (Try, Conversión, Kick H) es el lado de la cancha del try o de la patada, no la zona
 * del tramo. Para no confundirlos con la fila «Zona», en pantalla se rotula distinto; el catálogo no se toca.
 */
const SIDE_LABELS: Record<string, string> = {
  TRY: 'Lado del try',
  CONVERSION: 'Lado de la patada',
  PENALTY_KICK: 'Lado de la patada'
};

const SIDE_FIELD_KEY = 'zone';

/** Rótulo con el que se muestra un atributo en el inspector «Ver»; los demás conservan el del catálogo. */
export function displayAttributeLabel(eventTypeCode: string | undefined, key: string, catalogLabel: string): string {
  if (key !== SIDE_FIELD_KEY || !eventTypeCode) return catalogLabel;
  return SIDE_LABELS[eventTypeCode] ?? catalogLabel;
}
