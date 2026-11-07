import { Match } from '../../match/types/match.types';
import { CoachBoardContext, buildCoachBoard, periodText } from './coach-board';

describe('coach-board', () => {
  const now = new Date(2026, 10, 6, 18, 0);
  const match = (overrides: Partial<Match>): Match => ({
    id: 'm1', date: '2026-11-07T14:30:00', divisionId: 'd1', status: 'empty_roster', currentPeriod: 1,
    clockElapsedSeconds: 0, clockPaused: true, currentPossession: 'NEUTRAL', homeScore: 0, awayScore: 0,
    opponent: { id: 'o', name: 'Trelew Rugby Club', alias: 'Trelew RC', city: 'Trelew' },
    ...overrides
  });
  const context = (matches: Match[], overrides: Partial<CoachBoardContext> = {}): CoachBoardContext => ({
    now, divisionName: 'Superior', matches, captureMatchId: null, progress: null, recent: [],
    roster: { starters: 15, substitutes: 6 }, readyOffline: true, ...overrides
  });

  it('partido en curso que captura este dispositivo: live-here con período y reloj', () => {
    const board = buildCoachBoard(context([match({ status: 'in_progress', homeScore: 14, awayScore: 7 })], {
      captureMatchId: 'm1', progress: { periodLabel: '2T', gameClock: '52:10' }
    }));
    expect(board).toEqual(jasmine.objectContaining({ kind: 'live-here', periodLabel: "2T 52'", ownScore: 14, opponentScore: 7 }));
  });

  it('partido en curso en otro dispositivo: live-elsewhere con el último dato en hora de Argentina', () => {
    const board = buildCoachBoard(context([match({ status: 'in_progress', clockUpdatedAt: '2026-11-06T17:05:00Z' })]));
    expect(board).toEqual(jasmine.objectContaining({ kind: 'live-elsewhere', lastDataAt: '14:05' }));
  });

  it('con menos de 24 h y nómina: match-day', () => {
    const board = buildCoachBoard(context([match({ status: 'not_started' })]));
    expect(board.kind).toBe('match-day');
  });

  it('más lejos: next con fecha relativa, hora y chips de nómina', () => {
    const board = buildCoachBoard(context([match({ date: '2026-11-09T14:30:00', status: 'not_started' })]));
    expect(board).toEqual(jasmine.objectContaining({
      kind: 'next', dateLabel: 'Lun 9 nov', time: '14:30', opponent: 'Trelew', city: 'Trelew', starters: 15, substitutes: 6, readyOffline: true
    }));
  });

  it('sin nómina a menos de 24 h sigue siendo next (no se ofrece capturar)', () => {
    expect(buildCoachBoard(context([match({ status: 'empty_roster' })])).kind).toBe('next');
  });

  it('sin partidos: primeros pasos para programar uno', () => {
    expect(buildCoachBoard(context([]))).toEqual({ kind: 'onboarding', step: 'schedule-match' });
  });

  it('el entretiempo se muestra como tal', () => {
    expect(periodText(match({ status: 'halftime' }), null)).toBe('Entretiempo');
  });
});
