import { LiveCaptureBackendResponse } from '../types/live-capture.types';

export const LIVE_CAPTURE_MOCK_RESPONSE: LiveCaptureBackendResponse = {
  query: {
    clubId: 'club-pmrc',
    divisionId: 'division-primera',
    matchId: 'match-pmrc-drc-001',
  },
  state: {
    homeTeam: 'PMRC',
    awayTeam: 'DRC',
    scoreboard: {
      home: 12,
      away: 7,
    },
    gameClock: '34:12',
    periodLabel: 'Fin 1er tiempo',
    clockPaused: false,
    currentPossession: 'own',
    synchronized: true,
    history: [
      { minute: '34:12', description: 'Try — Lucas Fernández (PMRC) 12-7' },
      { minute: '31:05', description: 'Tackle completado — Martín Rizzo' },
      { minute: '28:40', description: 'Scrum ganado — PMRC' },
      { minute: '24:12', description: 'Turnover recuperado' },
      { minute: '19:03', description: 'Penal a los palos — convertido' },
    ],
  },
  recentEvents: [
    {
      id: 'evt-001',
      eventType: 'try',
      match: 'match-pmrc-drc-001',
      teamPossession: 'own',
      matchTime: 34,
      period: 1,
      origin: 'live-capture',
      synchronizedAt: '2026-09-07T14:34:12Z',
      player: null,
      realTime: 0,
      createdAt: ''
    },
    {
      id: 'evt-002',
      eventType: 'tackle-completado',
      teamPossession: 'own',
      matchTime: 31,
      period: 1,
      origin: 'live-capture',
      synchronizedAt: '2026-09-07T14:31:05Z',
      match: '',
      player: null,
      realTime: 0,
      createdAt: ''
    },
    {
      id: 'evt-003',
      eventType: 'turnover',
      teamPossession: 'opponent',
      matchTime: 24,
      period: 1,
      origin: 'live-capture',
      synchronizedAt: '2026-09-07T14:24:12Z',
      match: '',
      player: null,
      realTime: 0,
      createdAt: ''
    },
  ],
  eventTypes: [
    { id: 'try', name: 'Try', groupName: 'Ataque', category: 'attack', affectsPossession: true, isScoring: true, points: 5, requiresPlayer: true, active: true },
    { id: 'penal-palos', name: 'Penal a los palos', groupName: 'Ataque', category: 'attack', affectsPossession: false, isScoring: true, points: 3, requiresPlayer: true, active: true },
    { id: 'drop-gol', name: 'Drop gol', groupName: 'Ataque', category: 'attack', affectsPossession: false, isScoring: true, points: 3, requiresPlayer: true, active: true },
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
