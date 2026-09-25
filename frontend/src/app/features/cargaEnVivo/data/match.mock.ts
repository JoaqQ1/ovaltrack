import { Match } from '../types/live-capture.types';

/** Partidos iniciales para desarrollo local hasta conectar el listado al backend. */
export const MOCK_MATCHES: Match[] = [
  { id: '550e8400-e29b-41d4-a716-446655440020', date: '2026-09-20', divisionId: '550e8400-e29b-41d4-a716-446655440001', opponent: 'Duendes RC', status: 'not_started' },
  { id: '550e8400-e29b-41d4-a716-446655440021', date: '2026-09-13', divisionId: '550e8400-e29b-41d4-a716-446655440001', opponent: 'CRAI', status: 'in_progress', score: { home: 14, away: 10 } },
  { id: '550e8400-e29b-41d4-a716-446655440022', date: '2026-09-06', divisionId: '550e8400-e29b-41d4-a716-446655440001', opponent: 'Universitario', status: 'finished', score: { home: 22, away: 17 } },
  { id: '550e8400-e29b-41d4-a716-446655440023', date: '2026-08-30', divisionId: '550e8400-e29b-41d4-a716-446655440001', opponent: 'La Salle', status: 'finished', score: { home: 12, away: 19 } },
];
