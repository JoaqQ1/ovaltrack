import { runSessionCleanups } from './session-cleanup';

describe('runSessionCleanups', () => {
  beforeEach(() => spyOn(console, 'error'));

  it('ejecuta todas las limpiezas registradas', () => {
    const a = jasmine.createSpy('a');
    const b = jasmine.createSpy('b');

    runSessionCleanups([a, b]);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('si una limpieza falla, las demás se ejecutan igual', () => {
    const failing = jasmine.createSpy('failing').and.throwError('boom');
    const after = jasmine.createSpy('after');

    runSessionCleanups([failing, after]);

    expect(after).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('sin limpiezas registradas no hace nada', () => {
    expect(() => runSessionCleanups([])).not.toThrow();
  });
});
