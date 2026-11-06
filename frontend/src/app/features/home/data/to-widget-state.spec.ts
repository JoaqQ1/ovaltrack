import { Subject, of, throwError } from 'rxjs';
import { WidgetState } from '../types/home.types';
import { toWidgetState } from './to-widget-state';

describe('toWidgetState', () => {
  function collect<T>(source: import('rxjs').Observable<T>, options = {}): WidgetState<T>[] {
    const states: WidgetState<T>[] = [];
    source.pipe(toWidgetState<T>(options)).subscribe(state => states.push(state));
    return states;
  }

  it('emite loading y luego ready con el dato y su fetchedAt', () => {
    const states = collect(of({ wins: 3 }), { now: () => 42 });
    expect(states).toEqual([
      { status: 'loading' },
      { status: 'ready', data: { wins: 3 }, fetchedAt: 42, stale: false }
    ]);
  });

  it('emite loading antes de que llegue la respuesta', () => {
    const response = new Subject<number>();
    const states = collect(response);
    expect(states).toEqual([{ status: 'loading' }]);
    response.next(1);
    expect(states.length).toBe(2);
  });

  it('una lista vacía es empty', () => {
    expect(collect(of([] as number[])).map(s => s.status)).toEqual(['loading', 'empty']);
  });

  it('null es empty', () => {
    expect(collect(of(null)).map(s => s.status)).toEqual(['loading', 'empty']);
  });

  it('isEmpty personalizado decide cuándo está vacío', () => {
    const states = collect(of({ total: 0 }), { isEmpty: (value: { total: number }) => value.total === 0 });
    expect(states[1].status).toBe('empty');
  });

  it('un error no se propaga: queda como estado error con mensaje', () => {
    const states = collect(throwError(() => new Error('500')));
    expect(states).toEqual([{ status: 'loading' }, { status: 'error', message: 'No pudimos cargar esto' }]);
  });

  it('el mensaje de error se puede personalizar', () => {
    const states = collect(throwError(() => new Error('x')), { errorMessage: 'Sin datos de forma' });
    expect(states[1]).toEqual({ status: 'error', message: 'Sin datos de forma' });
  });
});
