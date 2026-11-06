import { analysisCoverage, minutesWithoutZone } from './analysis-coverage';

describe('analysisCoverage', () => {
  it('sin eventos es 100 %', () => {
    expect(analysisCoverage([])).toEqual({ totalEvents: 0, withoutPlayer: 0, percent: 100 });
  });

  it('cuenta las jugadas propias sin jugador', () => {
    const result = analysisCoverage([
      { playerId: 'p1', teamPossession: 'OWN' },
      { playerId: null, teamPossession: 'OWN' },
      { playerId: '  ', teamPossession: 'NEUTRAL' },
      { playerId: 'p2', teamPossession: 'OWN' }
    ]);
    expect(result).toEqual({ totalEvents: 4, withoutPlayer: 2, percent: 50 });
  });

  it('los eventos del rival no cuentan como pendientes', () => {
    const result = analysisCoverage([
      { playerId: null, teamPossession: 'OPPONENT' },
      { playerId: null, teamPossession: 'OPPONENT' },
      { playerId: 'p1', teamPossession: 'OWN' }
    ]);
    expect(result.withoutPlayer).toBe(0);
    expect(result.percent).toBe(100);
  });

  it('redondea el porcentaje', () => {
    const events = [
      ...Array.from({ length: 2 }, () => ({ playerId: 'p', teamPossession: 'OWN' as const })),
      { playerId: null, teamPossession: 'OWN' as const }
    ];
    expect(analysisCoverage(events).percent).toBe(67);
  });
});

describe('minutesWithoutZone', () => {
  it('sin tramos faltan los 80 minutos', () => {
    expect(minutesWithoutZone([])).toBe(80);
  });

  it('descuenta los tramos de ambos tiempos', () => {
    expect(minutesWithoutZone([
      { period: 1, startMinute: 0, endMinute: 40 },
      { period: 2, startMinute: 40, endMinute: 55 }
    ])).toBe(25);
  });
});
