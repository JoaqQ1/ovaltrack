import { Observable, OperatorFunction, catchError, map, of, startWith } from 'rxjs';
import { WidgetState } from '../types/home.types';

export const WIDGET_ERROR_MESSAGE = 'No pudimos cargar esto';

export interface ToWidgetStateOptions<T> {
  /** Cuándo el dato cuenta como vacío; por defecto `null`, `undefined` o lista sin elementos. */
  isEmpty?: (value: T) => boolean;
  errorMessage?: string;
  now?: () => number;
}

const isNullOrEmptyList = (value: unknown): boolean =>
  value == null || (Array.isArray(value) && value.length === 0);

/**
 * Convierte una carga HTTP en el estado de un widget: emite `loading` enseguida y luego `ready`,
 * `empty` o `error`. El error nunca se propaga, así un widget que falla no tumba al resto.
 */
export function toWidgetState<T>(options: ToWidgetStateOptions<T> = {}): OperatorFunction<T, WidgetState<T>> {
  const { isEmpty = isNullOrEmptyList, errorMessage = WIDGET_ERROR_MESSAGE, now = Date.now } = options;
  return (source: Observable<T>) => source.pipe(
    map((value): WidgetState<T> => isEmpty(value)
      ? { status: 'empty' }
      : { status: 'ready', data: value, fetchedAt: now(), stale: false }),
    catchError(() => of<WidgetState<T>>({ status: 'error', message: errorMessage })),
    startWith<WidgetState<T>>({ status: 'loading' })
  );
}
