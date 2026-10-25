import { currentLineup, Lineup } from './lineup';
import { AvailablePlayer } from '../types/roster.types';
import { buildEventType, buildLocalEvent } from '../../../testing/offline-test-helpers';
import { LocalMatchEvent } from '../types/event.types';

const player = (id: string): AvailablePlayer => ({ id, fullName: id, jerseyNumber: null, position: null });
const substitution = buildEventType({ id: 'sub', code: 'SUBSTITUTION', actor: 'CHOOSE' });
const typeById = (id: string) => (id === 'sub' ? substitution : undefined);

const initial = (): Lineup => ({
  starters: new Map([[1, player('A')], [2, player('B')]]),
  substitutes: new Map([[16, player('X')], [17, player('Y')]]),
});

let sequence = 0;
const change = (out: number, into: number, teamPossession: 'OWN' | 'OPPONENT' = 'OWN'): LocalMatchEvent => {
  sequence++;
  return buildLocalEvent({
    id: `s-${sequence}`, localSequence: sequence, eventTypeId: 'sub', teamPossession,
    attributes: { playerOutNumber: out, playerInNumber: into },
  });
};

const ids = (map: Map<number, AvailablePlayer>) => [...map.entries()].map(([slot, p]) => `${slot}:${p.id}`);

describe('currentLineup', () => {
  it('sin cambios devuelve la formación inicial', () => {
    const lineup = currentLineup(initial(), [], typeById);
    expect(ids(lineup.starters)).toEqual(['1:A', '2:B']);
    expect(ids(lineup.substitutes)).toEqual(['16:X', '17:Y']);
  });

  it('el que entra ocupa el slot del que sale y el que sale queda en el banco', () => {
    const lineup = currentLineup(initial(), [change(2, 16)], typeById);
    expect(ids(lineup.starters)).toEqual(['1:A', '2:X']);
    expect(ids(lineup.substitutes)).toEqual(['16:B', '17:Y']);
  });

  it('aplica los cambios en orden: un jugador puede volver a entrar', () => {
    const lineup = currentLineup(initial(), [change(2, 16), change(2, 16)], typeById);
    expect(ids(lineup.starters)).toEqual(['1:A', '2:B']);
  });

  it('ignora los cambios del rival', () => {
    const lineup = currentLineup(initial(), [change(1, 17, 'OPPONENT')], typeById);
    expect(ids(lineup.starters)).toEqual(['1:A', '2:B']);
  });

  it('no modifica la formación inicial: sin el evento, el cambio se revierte', () => {
    const start = initial();
    currentLineup(start, [change(1, 17)], typeById);
    expect(ids(currentLineup(start, [], typeById).starters)).toEqual(['1:A', '2:B']);
  });
});
