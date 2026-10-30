import { MatchTimelineEventResponse } from '../../types/event.types';
import { ZONE_HALF_MINUTES, ZonePeriod } from '../../types/zone.types';

export type EventMarkKind = 'try' | 'kick' | 'card' | 'other';

export type MarkEvent = Pick<MatchTimelineEventResponse, 'id' | 'period' | 'matchTime' | 'eventTypeName' | 'playerName'>;

/** Una marca de la timeline: todos los eventos de un mismo minuto de un mismo tiempo (nunca se superponen). */
export interface EventMark {
  period: ZonePeriod;
  /** Minuto acumulado de partido (0–80) en el que se dibuja; el tiempo añadido se apila en el borde 40 / 80. */
  minute: number;
  count: number;
  /** Eventos de tiempo añadido apilados en esta marca (se muestran como "+N"). */
  addedCount: number;
  kind: EventMarkKind;
  tooltip: string;
  ariaLabel: string;
}

const SECONDS_PER_MINUTE = 60;
const KIND_PRIORITY: EventMarkKind[] = ['try', 'card', 'kick', 'other'];

/** Clasifica por nombre del tipo de evento, igual que el resto de la revisión post-partido. */
export function eventMarkKind(eventTypeName: string): EventMarkKind {
  const name = eventTypeName.toLowerCase();
  if (name.includes('try')) return 'try';
  if (name.includes('tarjeta')) return 'card';
  if (name.includes('conversi') || name.includes('drop') || name.includes('penal a palos') || name.includes('kick h')) return 'kick';
  return 'other';
}

function isPeriod(period: number): period is ZonePeriod {
  return period === 1 || period === 2;
}

function describe(event: MarkEvent): string {
  const player = event.playerName?.trim();
  return player ? `${event.eventTypeName} · ${player}` : event.eventTypeName;
}

/**
 * Agrupa los eventos en marcas por (tiempo, minuto). Los eventos después del 40′ (1T) o del 80′ (2T) se apilan
 * en ese borde, consistente con la regla de tiempo añadido. Ignora eventos sin tiempo válido.
 */
export function buildEventMarks(events: MarkEvent[]): EventMark[] {
  const groups = new Map<string, { period: ZonePeriod; minute: number; added: number; events: MarkEvent[] }>();

  for (const event of events) {
    if (!isPeriod(event.period) || !Number.isFinite(event.matchTime) || event.matchTime < 0) continue;

    const periodStart = (event.period - 1) * ZONE_HALF_MINUTES;
    const periodEnd = event.period * ZONE_HALF_MINUTES;
    const isAdded = event.matchTime > periodEnd * SECONDS_PER_MINUTE;
    const minute = Math.min(Math.max(Math.floor(event.matchTime / SECONDS_PER_MINUTE), periodStart), periodEnd);

    const key = `${event.period}-${minute}`;
    const group = groups.get(key) ?? { period: event.period, minute, added: 0, events: [] };
    group.events.push(event);
    if (isAdded) group.added++;
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => a.minute - b.minute || a.period - b.period)
    .map(group => {
      const kind = KIND_PRIORITY.find(k => group.events.some(e => eventMarkKind(e.eventTypeName) === k)) ?? 'other';
      const lines = group.events.map(describe);
      const heading = `${group.minute}′${group.added > 0 ? ` (${group.added} de tiempo añadido)` : ''}`;
      return {
        period: group.period,
        minute: group.minute,
        count: group.events.length,
        addedCount: group.added,
        kind,
        tooltip: [heading, ...lines].join('\n'),
        ariaLabel: `Minuto ${heading}: ${lines.join(', ')}`
      };
    });
}
