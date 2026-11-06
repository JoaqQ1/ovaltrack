import { LiveCaptureEventType } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
import { MatchRosterPlayer } from '../types/roster.types';

/** Jugadores por su número permanente del partido. */
export interface Lineup {
  starters: Map<number, MatchRosterPlayer>;
  substitutes: Map<number, MatchRosterPlayer>;
}

const readSlot = (event: LocalMatchEvent, key: string): number | null => {
  const value = event.attributes?.[key];
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
};

/**
 * Formación actual: la inicial (plantel guardado) más los cambios propios en el orden en que se
 * cargaron. El plantel guardado no se modifica al registrar un cambio, así que borrar el evento
 * lo revierte y un cambio cargado offline se ve sin esperar a la sincronización.
 */
export function currentLineup(
  initial: Lineup,
  events: LocalMatchEvent[],
  eventTypeById: (eventTypeId: string) => LiveCaptureEventType | undefined,
): Lineup {
  const starters = new Map(initial.starters);
  const substitutes = new Map(initial.substitutes);

  for (const event of events) {
    if (eventTypeById(event.eventTypeId)?.code !== 'SUBSTITUTION' || event.teamPossession !== 'OWN') {
      continue;
    }

    const playerOut = readSlot(event, 'playerOutNumber');
    const playerIn = readSlot(event, 'playerInNumber');
    if (playerOut === null || playerIn === null) {
      continue;
    }

    const outgoing = starters.get(playerOut);
    const incoming = substitutes.get(playerIn);
    if (outgoing && incoming) {
      starters.set(playerOut, {
        ...incoming,
        fieldStatus: 'EN_CANCHA',
        fieldSlot: outgoing.fieldSlot,
      });
      substitutes.set(playerIn, {
        ...outgoing,
        fieldStatus: 'EN_BANCO',
        fieldSlot: null,
      });
    }
  }

  return { starters, substitutes };
}
