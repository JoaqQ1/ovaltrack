import { computePlayerStatistics, RosterPlayerInfo } from './player-statistics-calculator';
import { buildEventType, buildLocalEvent } from '../../../../testing/offline-test-helpers';

const tryType = buildEventType({
  id: 'try', code: 'TRY', name: 'Try', groupName: 'Puntuación', isScoring: true, points: 5,
  requiresPlayer: true, statView: ['basic', 'intermediate'],
});
const conversion = buildEventType({
  id: 'conversion', code: 'CONVERSION', name: 'Conversión', groupName: 'Puntuación', isScoring: true, points: 2,
  requiresPlayer: true, statView: ['intermediate'],
  templateEventFields: [
    { key: 'wasSuccessful', label: 'Resultado', type: 'boolean', phase: 'live', required: true, effects: ['scoring'] },
  ],
});
const pass = buildEventType({
  id: 'pass', code: 'PASS_OFFLOAD', name: 'Pase', groupName: 'Ataque', requiresPlayer: true, statView: [],
});
const dropGoal = buildEventType({
  id: 'drop', code: 'DROP_GOAL', name: 'Drop', groupName: 'Puntuación', isScoring: true, points: 3,
  requiresPlayer: false, statView: ['intermediate'],
});
const types = [tryType, conversion, pass, dropGoal];

const roster: RosterPlayerInfo[] = [
  { playerId: 'p-10', jerseyNumber: 10, playerName: 'Apertura', isStarter: true },
  { playerId: 'p-16', jerseyNumber: 16, playerName: 'Suplente', isStarter: false },
];

describe('computePlayerStatistics', () => {
  const events = [
    buildLocalEvent({ id: 'a', eventTypeId: 'try', playerId: 'p-10', teamPossession: 'OWN' }),
    buildLocalEvent({ id: 'b', eventTypeId: 'conversion', playerId: 'p-10', teamPossession: 'OWN', attributes: { wasSuccessful: true } }),
    // Atribuido por número de slot, sin playerId.
    buildLocalEvent({ id: 'c', eventTypeId: 'conversion', playerId: null, teamPossession: 'OWN', attributes: { playerNumber: 10, wasSuccessful: false } }),
    buildLocalEvent({ id: 'd', eventTypeId: 'pass', playerId: 'p-10', teamPossession: 'OWN' }),
    // El slot 10 del rival no es nuestro 10.
    buildLocalEvent({ id: 'e', eventTypeId: 'try', playerId: null, teamPossession: 'OPPONENT', attributes: { playerNumber: 10 } }),
  ];

  it('arma una columna por tipo de la vista que requiere jugador', () => {
    const { columns } = computePlayerStatistics(events, roster, types, 'intermediate');

    expect(columns.map(column => [column.code, column.hasAttempts])).toEqual([['TRY', false], ['CONVERSION', true]]);
  });

  it('cuenta los eventos de cada columna y suma los puntos de todos los tipos', () => {
    const { players } = computePlayerStatistics(events, roster, types, 'intermediate');
    const flyHalf = players.find(player => player.playerId === 'p-10');

    expect(flyHalf?.values['try']).toEqual({ count: 1, made: 1 });
    expect(flyHalf?.values['conversion']).toEqual({ count: 2, made: 1 });
    expect(flyHalf?.values['pass']).withContext('el pase no está en la vista intermedia').toBeUndefined();
    expect(flyHalf?.totalPoints).toBe(7);
    expect(flyHalf?.minutesPlayed).toBe(40);
    expect(flyHalf?.hasActivity).toBeTrue();

    const sub = players.find(player => player.playerId === 'p-16');
    expect(sub?.hasActivity).toBeFalse();
    expect(sub?.minutesPlayed).toBe(0);
  });

  it('en el post-partido incluye todos los tipos con jugador', () => {
    const { columns, players } = computePlayerStatistics(events, roster, types, 'full');

    expect(columns.map(column => column.code)).toEqual(['TRY', 'CONVERSION', 'PASS_OFFLOAD']);
    expect(players[0].values['pass']).toEqual({ count: 1, made: null });
  });
});
