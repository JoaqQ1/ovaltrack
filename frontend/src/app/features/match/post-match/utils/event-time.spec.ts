import { fromMatchTimeSeconds, toMatchTimeSeconds, validateEventTime } from './event-time';

describe('validateEventTime', () => {
  it('acepta los bordes del 1T', () => {
    expect(validateEventTime(1, 0, 0)).toBeNull();
    expect(validateEventTime(1, 40, 0)).toBeNull();
  });

  it('rechaza un minuto vacío o negativo', () => {
    expect(validateEventTime(1, null, 0)).toBe('Ingresá un minuto válido');
    expect(validateEventTime(1, -1, 0)).toBe('Ingresá un minuto válido');
  });

  it('sugiere el 2T si el minuto supera los 40 en el 1T', () => {
    expect(validateEventTime(1, 45, 0)).toContain('seleccioná el 2° Tiempo');
  });

  it('rechaza más de 80 minutos en el 2T', () => {
    expect(validateEventTime(2, 80, 0)).toBeNull();
    expect(validateEventTime(2, 81, 0)).toBe('El 2° Tiempo no puede superar los 80 minutos de partido.');
  });

  it('rechaza segundos fuera de 0-59', () => {
    expect(validateEventTime(1, 10, 60)).toBe('Los segundos deben estar entre 0 y 59');
    expect(validateEventTime(1, 10, null)).toBeNull();
  });
});

describe('toMatchTimeSeconds', () => {
  it('en el 1T son los segundos tal cual', () => {
    expect(toMatchTimeSeconds(1, 12, 30)).toBe(750);
  });

  it('en el 2T el minuto del período se cuenta desde el 40', () => {
    expect(toMatchTimeSeconds(2, 5, 0)).toBe(45 * 60);
  });

  it('en el 2T el minuto acumulado se respeta', () => {
    expect(toMatchTimeSeconds(2, 52, 10)).toBe(52 * 60 + 10);
    expect(toMatchTimeSeconds(2, 40, 0)).toBe(40 * 60);
  });
});

describe('fromMatchTimeSeconds', () => {
  it('devuelve minuto acumulado y segundo', () => {
    expect(fromMatchTimeSeconds(52 * 60 + 10)).toEqual({ minute: 52, second: 10 });
    expect(fromMatchTimeSeconds(0)).toEqual({ minute: 0, second: 0 });
  });

  it('es la inversa de toMatchTimeSeconds', () => {
    const { minute, second } = fromMatchTimeSeconds(3725);
    expect(toMatchTimeSeconds(2, minute, second)).toBe(3725);
  });
});
