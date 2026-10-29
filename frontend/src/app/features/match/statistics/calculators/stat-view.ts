import { LiveCaptureEventType, TemplateField } from '../../types/event-type.types';
import { StatView } from '../types/statistic.types';

/** El tipo se muestra en la vista según `statView`; la vista `full` (post-partido) muestra todos. */
export function isTypeInView(type: LiveCaptureEventType, view: StatView): boolean {
  return view === 'full' || (type.statView ?? []).includes(view);
}

/**
 * Campos a desglosar en la vista. Durante el partido solo los `live`: los `post` se completan
 * después, con el video, y todavía estarían vacíos.
 */
export function fieldsInView(type: LiveCaptureEventType, view: StatView): TemplateField[] {
  const fields = type.templateEventFields ?? [];
  return view === 'full' ? fields : fields.filter(field => field.phase === 'live');
}

/** Un campo boolean con efecto `scoring` decide si el intento sumó: ya se refleja en `made`. */
export function isScoringField(field: TemplateField): boolean {
  return field.type === 'boolean' && (field.effects ?? []).includes('scoring');
}
