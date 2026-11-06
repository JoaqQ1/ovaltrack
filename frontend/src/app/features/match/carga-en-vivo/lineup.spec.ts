import { currentLineup, Lineup } from './lineup';
import { MatchRosterPlayer } from '../types/roster.types';
import { buildEventType, buildLocalEvent } from '../../../testing/offline-test-helpers';
import { LocalMatchEvent } from '../types/event.types';

const player = (id: string, number: number, role: 'TITULAR' | 'SUPLENTE'): MatchRosterPlayer => ({
  id, fullName: id, position: null, number, role,
  fieldStatus: role === 'TITULAR' ? 'EN_CANCHA' : 'EN_BANCO',
  fieldSlot: role === 'TITULAR' ? number : null,
  slotOrder: number,
});
const substitution = buildEventType({ id: 'sub', code: 'SUBSTITUTION', actor: 'CHOOSE' });
const typeById = (id: string) => (id === 'sub' ? substitution : undefined);

const initial = (): Lineup => ({
  onField: new Map([[7, player('A', 7, 'TITULAR')], [99, player('B', 99, 'TITULAR')]]),
  bench: new Map([[42, player('X', 42, 'SUPLENTE')], [1000, player('Y', 1000, 'SUPLENTE')]]),
});

let sequence = 0;
const change = (out: number, into: number, teamPossession: 'OWN' | 'OPPONENT' = 'OWN'): LocalMatchEvent => {
  sequence++;
  return buildLocalEvent({
    id: `s-${sequence}`, localSequence: sequence, eventTypeId: 'sub', teamPossession,
    attributes: { playerOutNumber: out, playerInNumber: into },
  });
};

const ids = (map: Map<number, MatchRosterPlayer>) => [...map.entries()].map(([slot, p]) => `${slot}:${p.id}`);

describe('currentLineup', () => {
  it('sin cambios devuelve la formación inicial', () => {
    const lineup = currentLineup(initial(), [], typeById);
    expect(ids(lineup.onField)).toEqual(['7:A', '99:B']);
    expect(ids(lineup.bench)).toEqual(['42:X', '1000:Y']);
  });

  it('el que entra ocupa el slot del que sale y el que sale queda en el banco', () => {
    const lineup = currentLineup(initial(), [change(99, 42)], typeById);
    expect(ids(lineup.onField)).toEqual(['7:A', '42:X']);
    expect(ids(lineup.bench)).toEqual(['1000:Y', '99:B']);
  });

  it('aplica los cambios en orden: un jugador puede volver a entrar', () => {
    const lineup = currentLineup(initial(), [change(99, 42), change(42, 99)], typeById);
    expect(ids(lineup.onField)).toEqual(['7:A', '99:B']);
  });

  it('ignora los cambios del rival', () => {
    const lineup = currentLineup(initial(), [change(7, 1000, 'OPPONENT')], typeById);
    expect(ids(lineup.onField)).toEqual(['7:A', '99:B']);
  });

  it('ignora eventos rechazados por el servidor', () => {
    const rejected = change(99, 42);
    rejected.syncFailedAt = '2026-10-23T15:00:00Z';
    rejected.syncErrorMessage = 'Roster desactualizado';
    const lineup = currentLineup(initial(), [rejected], typeById);
    expect(ids(lineup.onField)).toEqual(['7:A', '99:B']);
    expect(ids(lineup.bench)).toEqual(['42:X', '1000:Y']);
  });

  it('no usa el número cuando el id informado no resuelve', () => {
    const event = change(99, 42);
    event.attributes = { playerOutId: 'missing', playerOutNumber: 99, playerInNumber: 42 };
    const lineup = currentLineup(initial(), [event], typeById);
    expect(ids(lineup.onField)).toEqual(['7:A', '99:B']);
  });

  it('no modifica la formación inicial: sin el evento, el cambio se revierte', () => {
    const start = initial();
    currentLineup(start, [change(7, 1000)], typeById);
    expect(ids(currentLineup(start, [], typeById).onField)).toEqual(['7:A', '99:B']);
  });
});
