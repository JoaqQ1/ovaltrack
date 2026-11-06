import { LiveCaptureEventType } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
import { MatchRosterPlayer } from '../types/roster.types';

export interface Lineup {
  onField: Map<number, MatchRosterPlayer>;
  bench: Map<number, MatchRosterPlayer>;
}

export function buildInitialLineup(players: MatchRosterPlayer[]): Lineup {
  const onField = new Map<number, MatchRosterPlayer>();
  const bench = new Map<number, MatchRosterPlayer>();
  players.forEach(player => {
    const normalized = player.role === 'TITULAR'
      ? { ...player, fieldStatus: 'EN_CANCHA' as const, fieldSlot: (player.slotOrder ?? 0) + 1 }
      : { ...player, fieldStatus: 'EN_BANCO' as const, fieldSlot: null };
    (player.role === 'TITULAR' ? onField : bench).set(player.number, normalized);
  });
  return { onField, bench };
}

const readNumber = (event: LocalMatchEvent, key: string): number | null => {
  const value = event.attributes?.[key];
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
};

const resolve = (
  map: Map<number, MatchRosterPlayer>,
  event: LocalMatchEvent,
  idKey: string,
  numberKey: string,
): MatchRosterPlayer | undefined => {
  const id = event.attributes?.[idKey];
  if (id !== undefined && id !== null) {
    if (typeof id !== 'string') {
      return undefined;
    }
    const byId = [...map.values()].find(player => player.id === id);
    return byId;
  }
  const number = readNumber(event, numberKey);
  return number === null ? undefined : map.get(number);
};

export function currentLineup(
  initial: Lineup,
  events: LocalMatchEvent[],
  eventTypeById: (eventTypeId: string) => LiveCaptureEventType | undefined,
): Lineup {
  const onField = new Map(initial.onField);
  const bench = new Map(initial.bench);
  const ordered = events
    .filter(event => event.active !== false
      && !event.syncFailedAt
      && event.teamPossession === 'OWN'
      && eventTypeById(event.eventTypeId)?.code === 'SUBSTITUTION')
    .sort((left, right) =>
      (left.absoluteMatchTime ?? Number.MAX_SAFE_INTEGER) - (right.absoluteMatchTime ?? Number.MAX_SAFE_INTEGER)
      || (Date.parse(left.realTime ?? left.createdAt ?? '') || 0) - (Date.parse(right.realTime ?? right.createdAt ?? '') || 0)
      || (left.localSequence ?? 0) - (right.localSequence ?? 0));

  for (const event of ordered) {
    const outgoing = resolve(onField, event, 'playerOutId', 'playerOutNumber');
    const incoming = resolve(bench, event, 'playerInId', 'playerInNumber');
    if (!outgoing || !incoming || outgoing.id === incoming.id) continue;
    onField.delete(outgoing.number);
    bench.delete(incoming.number);
    onField.set(incoming.number, { ...incoming, fieldStatus: 'EN_CANCHA', fieldSlot: outgoing.fieldSlot });
    bench.set(outgoing.number, { ...outgoing, fieldStatus: 'EN_BANCO', fieldSlot: null });
  }
  return { onField, bench };
}
