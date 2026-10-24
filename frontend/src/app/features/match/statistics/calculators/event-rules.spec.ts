import { LiveCaptureEventType } from '../../types/event-type.types';
import { countsAsScoring, followUpChoices, opposite, possessionRule, resolveActor } from './event-rules';

declare const describe: (description: string, specDefinitions: () => void) => void;
declare const it: (description: string, testFunction: () => void | Promise<void>) => void;
declare const expect: (actual: unknown) => {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
};

const type = (overrides: Partial<LiveCaptureEventType> = {}): LiveCaptureEventType => ({
  id: 'type', name: 'Evento', groupName: 'Ataque', category: 'ATTACK', isScoring: false, points: 0,
  requiresPlayer: true, isActive: true, code: 'EVENTO', showInPalette: true, followUpEventTypeId: null,
  actor: 'ATTACKING', possessionAfter: 'KEEP', followUpChoices: [], templateEventFields: [],
  createdAt: '2026-09-14T12:00:00Z', ...overrides,
});

const result = (possession?: 'KEEP' | 'ACTOR' | 'OTHER') => ({
  key: 'result', label: 'Resultado', type: 'select' as const, phase: 'live' as const, required: true,
  options: [
    { value: 'a', label: 'A', possession, followUps: [{ code: 'NEXT' }] },
    { value: 'b', label: 'B' },
  ],
});

describe('event-rules', () => {
  it('resolves the actor from the possession', () => {
    expect(resolveActor(type({ actor: 'ATTACKING' }), 'OWN')).toBe('OWN');
    expect(resolveActor(type({ actor: 'DEFENDING' }), 'OWN')).toBe('OPPONENT');
    expect(resolveActor(type({ actor: 'DEFENDING' }), 'OPPONENT')).toBe('OWN');
  });

  it('asks the analyst for the team when the actor is CHOOSE or possession is neutral', () => {
    expect(resolveActor(type({ actor: 'CHOOSE' }), 'OWN')).toBe(null);
    expect(resolveActor(type({ actor: 'ATTACKING' }), 'NEUTRAL')).toBe(null);
  });

  it('opposes the teams', () => {
    expect(opposite('OWN')).toBe('OPPONENT');
    expect(opposite('OPPONENT')).toBe('OWN');
  });

  it('uses the possession of the chosen option over the type default', () => {
    const t = type({ possessionAfter: 'KEEP', templateEventFields: [result('OTHER')] });
    expect(possessionRule(t, { result: 'a' })).toBe('OTHER');
    expect(possessionRule(t, { result: 'b' })).toBe('KEEP');
  });

  it('does not change the possession when a boolean with the possession effect is false', () => {
    const t = type({
      possessionAfter: 'OTHER',
      templateEventFields: [{ key: 'ok', label: 'Resultado', type: 'boolean', phase: 'live', required: true, effects: ['possession'] }],
    });
    expect(possessionRule(t, { ok: true })).toBe('OTHER');
    expect(possessionRule(t, { ok: false })).toBe('KEEP');
  });

  it('only scores when the scoring field is not false', () => {
    const t = type({
      isScoring: true, points: 3,
      templateEventFields: [{ key: 'ok', label: 'Resultado', type: 'boolean', phase: 'live', required: true, effects: ['scoring'] }],
    });
    expect(countsAsScoring(t, { ok: true })).toBe(true);
    expect(countsAsScoring(t, { ok: false })).toBe(false);
    expect(countsAsScoring(t, null)).toBe(true);
  });

  it('prefers the follow-ups of the chosen option over the ones of the type', () => {
    const t = type({ followUpChoices: [{ code: 'TYPE' }], templateEventFields: [result()] });
    expect(followUpChoices(t, { result: 'a' })).toEqual([{ code: 'NEXT' }]);
    expect(followUpChoices(t, { result: 'b' })).toEqual([{ code: 'TYPE' }]);
  });
});
