import { LiveCaptureEventType, TemplateField } from '../../types/event-type.types';

export const liveFields = (t: LiveCaptureEventType): TemplateField[] =>
  (t.templateEventFields ?? []).filter(f => f.phase === 'live');

function effectActive(type: LiveCaptureEventType, effect: string, attrs?: Record<string, unknown> | null): boolean {
  const field = type.templateEventFields?.find(f => f.effects?.includes(effect as never));
  return !field || attrs?.[field.key] !== false;
}
export const countsAsScoring = (t: LiveCaptureEventType, a?: Record<string, unknown> | null) =>
  !!t.isScoring && effectActive(t, 'scoring', a);

export const flipsPossession = (t: LiveCaptureEventType, a?: Record<string, unknown> | null) =>
  !!t.affectsPossession && effectActive(t, 'possession', a);