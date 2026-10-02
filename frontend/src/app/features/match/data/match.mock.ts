import { Match } from '../types/match.types';

/** Partidos iniciales para desarrollo local hasta conectar el listado al backend. */
export const MOCK_MATCHES: Match[] = [
  { id: '550e8400-e29b-41d4-a716-446655440020', date: '2026-09-20', divisionId: '11111111-1111-1111-1111-000000000020', opponent: 'Duendes RC', status: 'not_started', currentPeriod: 1, clockElapsedSeconds: 0, clockPaused: true, currentPossession: 'OWN', homeScore: 0, awayScore: 0 },
  { id: '550e8400-e29b-41d4-a716-446655440021', date: '2026-09-13', divisionId: '11111111-1111-1111-1111-000000000020', opponent: 'CRAI', status: 'in_progress', currentPeriod: 1, clockElapsedSeconds: 1200, clockPaused: false, currentPossession: 'OWN', homeScore: 14, awayScore: 10 },
  { id: '550e8400-e29b-41d4-a716-446655440022', date: '2026-09-06', divisionId: '11111111-1111-1111-1111-000000000020', opponent: 'Universitario', status: 'finished', currentPeriod: 2, clockElapsedSeconds: 4800, clockPaused: true, currentPossession: 'OWN', homeScore: 22, awayScore: 17 },
  { id: '550e8400-e29b-41d4-a716-446655440023', date: '2026-08-30', divisionId: '11111111-1111-1111-1111-000000000020', opponent: 'La Salle', status: 'finished', currentPeriod: 2, clockElapsedSeconds: 4800, clockPaused: true, currentPossession: 'OWN', homeScore: 12, awayScore: 19 },
];
