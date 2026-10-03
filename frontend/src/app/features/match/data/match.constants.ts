import { RosterSlot, RugbySlotDefinition } from '../types/roster.types';

export const TEMPORARY_DIVISION_ID = '11111111-1111-1111-1111-000000000020';

export const RUGBY_STARTING_SLOT_DEFINITIONS: readonly RugbySlotDefinition[] = [
  { number: 1, positionName: 'Pilar Izquierdo', positionCategory: 'primera_linea', isStarter: true },
  { number: 2, positionName: 'Hooker', positionCategory: 'primera_linea', isStarter: true },
  { number: 3, positionName: 'Pilar Derecho', positionCategory: 'primera_linea', isStarter: true },
  { number: 4, positionName: 'Segunda Línea', positionCategory: 'segunda_linea', isStarter: true },
  { number: 5, positionName: 'Segunda Línea', positionCategory: 'segunda_linea', isStarter: true },
  { number: 6, positionName: 'Ala / Flanker', positionCategory: 'tercera_linea', isStarter: true },
  { number: 7, positionName: 'Ala / Flanker', positionCategory: 'tercera_linea', isStarter: true },
  { number: 8, positionName: 'Octavo (N° 8)', positionCategory: 'tercera_linea', isStarter: true },
  { number: 9, positionName: 'Medio Scrum', positionCategory: 'medios', isStarter: true },
  { number: 10, positionName: 'Apertura', positionCategory: 'medios', isStarter: true },
  { number: 11, positionName: 'Wing Izquierdo', positionCategory: 'backs', isStarter: true },
  { number: 12, positionName: 'Primer Centro', positionCategory: 'backs', isStarter: true },
  { number: 13, positionName: 'Segundo Centro', positionCategory: 'backs', isStarter: true },
  { number: 14, positionName: 'Wing Derecho', positionCategory: 'backs', isStarter: true },
  { number: 15, positionName: 'Fullback', positionCategory: 'backs', isStarter: true },
];

export const RUGBY_SUBSTITUTE_SLOT_DEFINITIONS: readonly RugbySlotDefinition[] = [
  { number: 16, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 17, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 18, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 19, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 20, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 21, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 22, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
  { number: 23, positionName: 'Suplente', positionCategory: 'suplente', isStarter: false },
];

export function createInitialStartingSlots(): RosterSlot[] {
  return RUGBY_STARTING_SLOT_DEFINITIONS.map(def => ({
    ...def,
    player: null,
  }));
}

export function createInitialSubstituteSlots(): RosterSlot[] {
  return RUGBY_SUBSTITUTE_SLOT_DEFINITIONS.map(def => ({
    ...def,
    player: null,
  }));
}