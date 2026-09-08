import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LiveCaptureService } from '../services/live-capture.service';
import { CargaEnVivoComponent } from './carga-en-vivo.component';

describe('CargaEnVivoComponent', () => {
  let fixture: ComponentFixture<CargaEnVivoComponent>;
  let component: CargaEnVivoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaEnVivoComponent],
      providers: [
        {
          provide: LiveCaptureService,
          useValue: {
            getLiveCaptureBootstrap: () => of({
              teamLocal: 'PMRC',
              teamVisitante: 'DRC',
              marcador: { local: 0, visitante: 0 },
              relojJuego: '00:00',
              periodoLabel: '1T',
              relojPausado: false,
              posesionActual: 'propio',
              sincronizado: false,
              categorias: [],
              historial: [],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CargaEnVivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should remove a history item directly from the list', () => {
    component.historial = [
      { id: 'evt-1', minuto: '00:10', descripcion: 'Try — PMRC' },
      { id: 'evt-2', minuto: '00:25', descripcion: 'Turnover' },
    ];

    component.eliminarEventoDelHistorial('evt-1');

    expect(component.historial.map(item => item.id)).toEqual(['evt-2']);
  });

  it('should undo a specific history item using its stored snapshot', () => {
    component.marcador = { local: 5, visitante: 1 };
    component.posesionActual = 'propio';

    const snapshot = {
      marcador: { local: 3, visitante: 1 },
      relojPausado: false,
      posesionActual: 'rival' as const,
      sincronizado: true,
      periodoLabel: '1T',
      categorias: [],
      historial: [],
    };

    (component as any).historialSnapshots = new Map([['evt-1', snapshot]]);
    component.historial = [{ id: 'evt-1', minuto: '00:10', descripcion: 'Try — PMRC' }];

    component.deshacerEventoDelHistorial('evt-1');

    expect(component.marcador.local).toBe(3);
    expect(component.posesionActual).toBe('rival');
    expect(component.historial).toEqual([]);
  });
});
