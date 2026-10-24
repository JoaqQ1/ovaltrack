import { formatMetric, formatPlayerValue, presentType, scoringLines } from './stat-presentation';
import { EventTypeStat, PlayerStatColumn } from '../types/statistic.types';

const conversion: EventTypeStat = {
  eventTypeId: 'conversion',
  code: 'CONVERSION',
  name: 'Conversión',
  isScoring: true,
  count: { own: 3, opponent: 1 },
  made: { own: 2, opponent: 0 },
  points: { own: 4, opponent: 0 },
  hasAttempts: true,
  fields: [
    { kind: 'number', key: 'distanceMeters', label: 'Distancia (m)', total: { own: 60, opponent: null }, average: { own: 30, opponent: null } },
    {
      kind: 'select', key: 'zone', label: 'Zona', pending: { own: 1, opponent: 0 },
      options: [
        { value: 'left', label: 'Izquierda', count: { own: 2, opponent: 0 } },
        { value: 'right', label: 'Derecha', count: { own: 0, opponent: 0 } },
      ],
    },
  ],
};

describe('stat-presentation', () => {
  it('muestra convertidos/intentos, puntos, totales numéricos y solo las opciones con eventos', () => {
    const presented = presentType(conversion, { includePoints: true });

    expect(presented.main).toEqual(jasmine.objectContaining({ label: 'Conversión', own: '2/3', opponent: '0/1', ownValue: 2 }));
    expect(presented.extra.map(line => [line.label, line.own, line.opponent])).toEqual([
      ['Puntos', '4', '0'],
      ['Distancia (m) · total', '60', '—'],
      ['Distancia (m) · promedio', '30.0', '—'],
    ]);
    expect(presented.lines.length).toBe(4);
    expect(presented.breakdowns).toEqual([{
      title: 'Zona',
      lines: [
        jasmine.objectContaining({ label: 'Izquierda', own: '2' }),
        jasmine.objectContaining({ label: 'Sin completar', own: '1' }),
      ],
    }]);
  });

  it('el desglose del marcador lista solo los tipos que suman', () => {
    const tackle: EventTypeStat = { ...conversion, eventTypeId: 't', code: 'TACKLE', name: 'Tackle', isScoring: false, made: null, points: null, hasAttempts: false };

    expect(scoringLines([{ name: 'G', types: [conversion, tackle] }]).map(line => line.label)).toEqual(['Conversión']);
  });

  it('formatea métricas y valores de jugador', () => {
    expect(formatMetric(66.7, 'percent')).toBe('66.7%');
    expect(formatMetric(2, 'signed')).toBe('+2');
    expect(formatMetric(null, 'int')).toBe('—');

    const column: PlayerStatColumn = { eventTypeId: 'c', code: 'CONVERSION', label: 'Conversión', groupName: 'G', isScoring: true, hasAttempts: true };
    expect(formatPlayerValue(column, { count: 2, made: 1 })).toBe('1/2');
    expect(formatPlayerValue(column, { count: 0, made: 0 })).toBe('—');
  });
});
