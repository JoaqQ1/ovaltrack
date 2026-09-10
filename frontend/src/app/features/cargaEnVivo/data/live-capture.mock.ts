import { LiveCaptureBackendResponse } from '../types/live-capture.types';

export const LIVE_CAPTURE_MOCK_RESPONSE: LiveCaptureBackendResponse = {
  query: {
    clubId: 'club-pmrc',
    divisionId: 'division-primera',
    matchId: 'match-pmrc-drc-001',
  },
  state: {
    teamLocal: 'PMRC',
    teamVisitante: 'DRC',
    marcador: {
      local: 12,
      visitante: 7,
    },
    relojJuego: '34:12',
    periodoLabel: 'Fin 1er tiempo',
    relojPausado: false,
    posesionActual: 'propio',
    sincronizado: true,
    categorias: [
      {
        nombre: 'Ataque',
        eventos: [
          { id: 'try', nombre: 'Try', contador: 1, variante: 'success' },
          { id: 'penal-palos', nombre: 'Penal a los palos', contador: 2, variante: 'warning' },
          { id: 'drop-gol', nombre: 'Drop gol', variante: 'default' },
        ],
      },
      {
        nombre: 'Defensa',
        eventos: [
          { id: 'tackle-completado', nombre: 'Tackle completado', contador: 8, variante: 'success' },
          { id: 'tackle-fallado', nombre: 'Tackle fallado', contador: 2, variante: 'danger' },
        ],
      },
      {
        nombre: 'Cambio de posesión',
        eventos: [{ id: 'turnover', nombre: 'Turnover', contador: 4, variante: 'warning' }],
      },
      {
        nombre: 'Formación fija',
        eventos: [
          { id: 'scrum', nombre: 'Scrum', contador: 3 },
          { id: 'line-out', nombre: 'Line-out', contador: 2 },
        ],
      },
      {
        nombre: 'Neutro',
        eventos: [
          { id: 'penal-infraccion', nombre: 'Penal / infracción', contador: 3, variante: 'default' },
          { id: 'amonestacion', nombre: 'Amonestación', variante: 'warning' },
          { id: 'expulsion', nombre: 'Expulsión', variante: 'danger' },
          { id: 'lesion', nombre: 'Lesión', variante: 'default' },
        ],
      },
    ],
    historial: [
      { minuto: '34:12', descripcion: 'Try — Lucas Fernández (PMRC) 12-7' },
      { minuto: '31:05', descripcion: 'Tackle completado — Martín Rizzo' },
      { minuto: '28:40', descripcion: 'Scrum ganado — PMRC' },
      { minuto: '24:12', descripcion: 'Turnover recuperado' },
      { minuto: '19:03', descripcion: 'Penal a los palos — convertido' },
    ],
  },
  recentEvents: [
    {
      id: 'evt-001',
      eventTypeId: 'try',
      eventTypeName: 'Try',
      teamPossession: 'propio',
      matchTime: 34,
      period: 1,
      origin: 'live-capture',
      points: 5,
      synchronizedAt: '2026-09-07T14:34:12Z',
    },
    {
      id: 'evt-002',
      eventTypeId: 'tackle-completado',
      eventTypeName: 'Tackle completado',
      teamPossession: 'propio',
      matchTime: 31,
      period: 1,
      origin: 'live-capture',
      points: 0,
      synchronizedAt: '2026-09-07T14:31:05Z',
    },
    {
      id: 'evt-003',
      eventTypeId: 'turnover',
      eventTypeName: 'Turnover',
      teamPossession: 'rival',
      matchTime: 24,
      period: 1,
      origin: 'live-capture',
      points: 0,
      synchronizedAt: '2026-09-07T14:24:12Z',
    },
  ],
  eventTypes: [
    { id: 'try', name: 'Try', groupName: 'Ataque', category: 'attack', affectsPossession: true, isScoring: true, points: 5, requiresPlayer: true, active: true },
    { id: 'penal-palos', name: 'Penal a los palos', groupName: 'Ataque', category: 'attack', affectsPossession: false, isScoring: true, points: 3, requiresPlayer: false, active: true },
    { id: 'drop-gol', name: 'Drop gol', groupName: 'Ataque', category: 'attack', affectsPossession: false, isScoring: true, points: 3, requiresPlayer: false, active: true },
    { id: 'tackle-completado', name: 'Tackle completado', groupName: 'Defensa', category: 'defense', affectsPossession: false, isScoring: false, requiresPlayer: true, active: true },
    { id: 'tackle-fallado', name: 'Tackle fallado', groupName: 'Defensa', category: 'defense', affectsPossession: true, isScoring: false, requiresPlayer: true, active: true },
    { id: 'turnover', name: 'Turnover', groupName: 'Cambio de posesión', category: 'possession', affectsPossession: true, isScoring: false, requiresPlayer: false, active: true },
    { id: 'scrum', name: 'Scrum', groupName: 'Formación fija', category: 'set-piece', affectsPossession: false, isScoring: false, requiresPlayer: false, active: true },
    { id: 'line-out', name: 'Line-out', groupName: 'Formación fija', category: 'set-piece', affectsPossession: false, isScoring: false, requiresPlayer: false, active: true },
    { id: 'penal-infraccion', name: 'Penal / infracción', groupName: 'Neutro', category: 'neutral', affectsPossession: false, isScoring: false, requiresPlayer: false, active: true },
    { id: 'amonestacion', name: 'Amonestación', groupName: 'Neutro', category: 'neutral', affectsPossession: false, isScoring: false, requiresPlayer: true, active: true },
    { id: 'expulsion', name: 'Expulsión', groupName: 'Neutro', category: 'neutral', affectsPossession: false, isScoring: false, requiresPlayer: true, active: true },
    { id: 'lesion', name: 'Lesión', groupName: 'Neutro', category: 'neutral', affectsPossession: false, isScoring: false, requiresPlayer: true, active: true },
  ],
};
