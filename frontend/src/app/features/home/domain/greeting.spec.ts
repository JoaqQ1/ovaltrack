import { greetingFor, hudDateLabel } from './greeting';

describe('greeting', () => {
  const at = (hour: number) => new Date(2026, 10, 6, hour, 0);

  it('saluda según la hora', () => {
    expect(greetingFor(at(0))).toBe('Buen día');
    expect(greetingFor(at(12))).toBe('Buen día');
    expect(greetingFor(at(13))).toBe('Buenas tardes');
    expect(greetingFor(at(19))).toBe('Buenas tardes');
    expect(greetingFor(at(20))).toBe('Buenas noches');
  });

  it('arma la fecha del HUD', () => {
    expect(hudDateLabel(at(10))).toBe('Viernes 6 nov');
  });
});
