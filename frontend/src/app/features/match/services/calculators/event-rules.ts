import { LiveCaptureEventType, TemplateField } from '../../types/event-type.types';

export const liveFields = (t: LiveCaptureEventType): TemplateField[] =>
  (t.templateEventFields ?? []).filter(f => f.phase === 'live');

export function countsAsScoring(t: LiveCaptureEventType, attrs?: Record<string, unknown> | null): boolean {
  if (!t.isScoring) return false;
  const f = t.templateEventFields?.find(x => x.effect === 'scoring');
  return !f || attrs?.[f.key] !== false;
}