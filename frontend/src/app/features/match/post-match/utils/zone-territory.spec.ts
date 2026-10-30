import { territoryOfColumn } from './zone-territory';

describe('zone-territory', () => {
  it('las columnas 1–3 son campo propio y las 4–6 campo rival', () => {
    expect([1, 2, 3].map(col => territoryOfColumn(col).side)).toEqual(['own', 'own', 'own']);
    expect([4, 5, 6].map(col => territoryOfColumn(col).side)).toEqual(['rival', 'rival', 'rival']);
  });

  it('la intensidad es simétrica: máxima en los in-goals y mínima en la mitad', () => {
    expect([1, 2, 3, 4, 5, 6].map(col => territoryOfColumn(col).weight)).toEqual([1, 0.6, 0.2, 0.2, 0.6, 1]);
  });

  it('una columna fuera de la grilla se limita al borde en vez de fallar', () => {
    expect(territoryOfColumn(0)).toEqual(territoryOfColumn(1));
    expect(territoryOfColumn(9)).toEqual(territoryOfColumn(6));
  });
});
