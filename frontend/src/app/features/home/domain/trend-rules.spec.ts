import { LINEOUT_METRIC, PENALTIES_METRIC, POINTS_METRIC, TACKLE_METRIC, computeFocus, computeTrend } from './trend-rules';

describe('computeTrend', () => {
  it('line que cae: −16,9 p.p., peor', () => {
    const trend = computeTrend([78, 70, 75, 80, 72, 76, 73, 58], LINEOUT_METRIC)!;
    expect(trend.latest).toBe(58);
    expect(trend.average).toBe(74.9);
    expect(trend.delta).toBe(-16.9);
    expect(trend.tone).toBe('worse');
  });

  it('penales que suben: +4, peor (subir es peor)', () => {
    const trend = computeTrend([9, 12, 8, 7, 10, 6, 11, 13], PENALTIES_METRIC)!;
    expect(trend.delta).toBe(4);
    expect(trend.tone).toBe('worse');
  });

  it('penales que bajan son mejores', () => {
    expect(computeTrend([9, 9, 9, 5], PENALTIES_METRIC)!.tone).toBe('better');
  });

  it('tackle: +1,6 p.p. es estable', () => {
    const trend = computeTrend([84, 82, 86, 88, 85, 90, 83, 87], TACKLE_METRIC)!;
    expect(trend.delta).toBe(1.6);
    expect(trend.tone).toBe('stable');
  });

  it('puntos: ±2 es estable y +3 es mejor', () => {
    expect(computeTrend([20, 20, 22], POINTS_METRIC)!.tone).toBe('stable');
    expect(computeTrend([20, 20, 23], POINTS_METRIC)!.tone).toBe('better');
  });

  it('sin partidos anteriores no hay tendencia', () => {
    expect(computeTrend([], LINEOUT_METRIC)).toBeNull();
    expect(computeTrend([70], LINEOUT_METRIC)).toBeNull();
  });
});

describe('computeFocus', () => {
  const stable = [80, 80, 80, 80];

  it('con menos de 3 partidos no hay alertas', () => {
    expect(computeFocus({ lineout: [80, 40], tackle: [80, 40], penalties: [2, 12] })).toEqual([]);
  });

  it('alerta por line y penales, ordenadas por |Δ|', () => {
    const focus = computeFocus({
      lineout: [78, 70, 75, 80, 72, 76, 73, 58],
      tackle: stable,
      penalties: [9, 12, 8, 7, 10, 6, 11, 13]
    });
    expect(focus.map(item => item.metric)).toEqual(['lineout', 'penalties']);
    expect(focus.every(item => item.tone === 'worse')).toBeTrue();
  });

  it('suma la mejora no estable de mayor |Δ|', () => {
    const focus = computeFocus({
      lineout: [70, 70, 70, 58],
      tackle: [80, 80, 80, 90],
      penalties: [8, 8, 8, 4]
    });
    expect(focus).toEqual([
      { metric: 'lineout', tone: 'worse', delta: -12 },
      { metric: 'tackle', tone: 'better', delta: 10 }
    ]);
  });

  it('sin desvíos importantes devuelve una lista vacía', () => {
    expect(computeFocus({ lineout: stable, tackle: stable, penalties: [8, 8, 8, 8] })).toEqual([]);
  });

  it('nunca devuelve más de 3 ítems', () => {
    const focus = computeFocus({ lineout: [80, 80, 80, 60], tackle: [80, 80, 80, 60], penalties: [4, 4, 4, 12] });
    expect(focus.length).toBeLessThanOrEqual(3);
  });
});
