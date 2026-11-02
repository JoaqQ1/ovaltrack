import { displayAttributeLabel } from './attribute-labels';

describe('attribute-labels', () => {
  it('el atributo zone del Try se rotula «Lado del try»', () => {
    expect(displayAttributeLabel('TRY', 'zone', 'Zona de apoyo')).toBe('Lado del try');
  });

  it('el atributo zone de Conversión y Kick H se rotula «Lado de la patada»', () => {
    expect(displayAttributeLabel('CONVERSION', 'zone', 'Zona de patada')).toBe('Lado de la patada');
    expect(displayAttributeLabel('PENALTY_KICK', 'zone', 'Zona de patada')).toBe('Lado de la patada');
  });

  it('otros atributos y otros tipos conservan el rótulo del catálogo', () => {
    expect(displayAttributeLabel('CONVERSION', 'distanceMeters', 'Distancia (m)')).toBe('Distancia (m)');
    expect(displayAttributeLabel('LINEOUT', 'zone', 'Zona de salto')).toBe('Zona de salto');
    expect(displayAttributeLabel(undefined, 'zone', 'Zona de apoyo')).toBe('Zona de apoyo');
  });
});
