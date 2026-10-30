import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    service.clear();
  });

  it('un toast sin acción conserva el comportamiento de siempre', () => {
    service.success('Guardado');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].action).toBeUndefined();
  });

  it('un toast puede llevar una acción con su texto y su handler', () => {
    const handler = jasmine.createSpy('handler');

    service.success('Tramo eliminado', 'Listo', 6000, { label: 'Deshacer', handler });

    expect(service.toasts()[0].action?.label).toBe('Deshacer');
    expect(service.toasts()[0].durationMs).toBe(6000);
    service.toasts()[0].action?.handler();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('todas las variantes aceptan la acción', () => {
    const action = { label: 'Reintentar', handler: () => undefined };

    for (const type of ['success', 'error', 'warning', 'info'] as const) {
      service[type]('mensaje', undefined, undefined, action);
      expect(service.toasts()[0].type).toBe(type);
      expect(service.toasts()[0].action).toBe(action);
    }
  });
});
