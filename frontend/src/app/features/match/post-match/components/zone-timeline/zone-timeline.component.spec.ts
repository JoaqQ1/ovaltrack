import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoneGapSelection, ZoneTimelineComponent } from './zone-timeline.component';
import { ZoneAssignmentResponse } from '../../../types/zone.types';
import { MarkEvent } from '../../utils/zone-event-marks';

describe('ZoneTimelineComponent', () => {
  let fixture: ComponentFixture<ZoneTimelineComponent>;

  const zone = (id: string, period: 1 | 2, startMinute: number, endMinute: number, row = 2, col = 3): ZoneAssignmentResponse =>
    ({ id, matchId: 'm', period, startMinute, endMinute, row, col });

  const segments = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[data-testid="timeline-segment"]'));
  const gaps = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[data-testid="timeline-gap"]'));

  function render(assignments: ZoneAssignmentResponse[], readOnly = false): void {
    fixture.componentRef.setInput('assignments', assignments);
    fixture.componentRef.setInput('readOnly', readOnly);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ZoneTimelineComponent] }).compileComponents();
    fixture = TestBed.createComponent(ZoneTimelineComponent);
  });

  it('sin tramos todo el partido es un hueco por tiempo', () => {
    render([]);

    expect(segments().length).toBe(0);
    expect(gaps().length).toBe(2);
  });

  it('dibuja un tramo con su etiqueta de zona y su posición proporcional a 80 minutos', () => {
    render([zone('a', 1, 10, 25, 2, 3)]);

    const bar = segments()[0];
    expect(bar.textContent).toContain('C3');
    expect(bar.style.left).toBe('12.5%');
    expect(bar.style.width).toBe('18.75%');
  });

  it('los huecos son los minutos sin tramo y no aparecen si el tiempo está cubierto', () => {
    render([zone('a', 1, 0, 40), zone('b', 2, 50, 80)]);

    expect(gaps().length).toBe(1);
    expect(gaps()[0].style.left).toBe('50%');
    expect(gaps()[0].style.width).toBe('12.5%');
  });

  it('tocar un tramo emite el tramo para editarlo', () => {
    const a = zone('a', 1, 10, 25);
    render([a]);
    const emitted: ZoneAssignmentResponse[] = [];
    fixture.componentInstance.segmentSelected.subscribe(z => emitted.push(z));

    segments()[0].click();

    expect(emitted).toEqual([a]);
  });

  it('tocar un hueco emite su tiempo y su rango para precargar el formulario', () => {
    render([zone('a', 1, 10, 25)]);
    const emitted: ZoneGapSelection[] = [];
    fixture.componentInstance.gapSelected.subscribe(g => emitted.push(g));

    gaps()[0].click();
    gaps()[1].click();

    expect(emitted).toEqual([
      { period: 1, startMinute: 0, endMinute: 10 },
      { period: 1, startMinute: 25, endMinute: 40 }
    ]);
  });

  it('marca el entretiempo en el minuto 40', () => {
    render([]);

    expect(fixture.componentInstance.halfMark).toBe(50);
  });

  it('en modo lectura las barras y los huecos están deshabilitados y no emiten', () => {
    render([zone('a', 1, 10, 25)], true);
    const emitted: unknown[] = [];
    fixture.componentInstance.segmentSelected.subscribe(z => emitted.push(z));
    fixture.componentInstance.gapSelected.subscribe(g => emitted.push(g));

    expect(segments()[0].disabled).toBeTrue();
    expect(gaps()[0].disabled).toBeTrue();
    fixture.componentInstance.selectSegment(zone('a', 1, 10, 25));
    fixture.componentInstance.selectGap({ period: 1, startMinute: 0, endMinute: 10 });

    expect(emitted).toEqual([]);
  });

  it('cada barra y hueco tiene un nombre accesible con su rango', () => {
    render([zone('a', 1, 10, 25)]);

    expect(segments()[0].getAttribute('aria-label')).toContain('1T 10′ a 25′');
    expect(gaps()[0].getAttribute('aria-label')).toContain('0′ a 10′');
  });

  it('resalta la barra del tramo en conflicto', () => {
    render([zone('a', 1, 0, 10), zone('b', 1, 10, 20)]);
    fixture.componentRef.setInput('conflictId', 'b');
    fixture.detectChanges();

    expect(segments().map(bar => bar.classList.contains('is-conflict'))).toEqual([false, true]);
  });

  describe('marcas de eventos', () => {
    const ev = (id: string, period: number, minute: number, name = 'Try'): MarkEvent =>
      ({ id, period, matchTime: minute * 60, eventTypeName: name, playerName: 'J. Pérez' });
    const marks = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[data-testid="timeline-mark"]'));

    function renderMarks(events: MarkEvent[], readOnly = false): void {
      render([], readOnly);
      fixture.componentRef.setInput('events', events);
      fixture.detectChanges();
    }

    it('dibuja una marca por minuto con tooltip de minuto, tipo y jugador', () => {
      renderMarks([ev('a', 1, 25), ev('b', 2, 50, 'Tarjeta Amarilla')]);

      expect(marks().length).toBe(2);
      expect(marks()[0].title).toBe('25′\nTry · J. Pérez');
      expect(marks()[1].classList).toContain('mark-card');
    });

    it('el tiempo añadido se apila en el borde con su indicador "+N"', () => {
      renderMarks([ev('a', 1, 41), ev('b', 1, 43)]);

      expect(marks().length).toBe(1);
      expect(fixture.nativeElement.querySelector('[data-testid="mark-added"]')?.textContent).toContain('+2');
    });

    it('tocar una marca emite su tiempo y minuto', () => {
      renderMarks([ev('a', 2, 55)]);
      const emitted: { period: number; minute: number }[] = [];
      fixture.componentInstance.markSelected.subscribe(mark => emitted.push(mark));

      marks()[0].click();

      expect(emitted).toEqual([{ period: 2, minute: 55 }]);
    });

    it('en modo lectura las marcas no responden', () => {
      renderMarks([ev('a', 1, 25)], true);

      expect(marks()[0].disabled).toBeTrue();
    });

    it('sin eventos no hay marcas', () => {
      renderMarks([]);

      expect(marks().length).toBe(0);
    });
  });

  describe('territorio', () => {
    it('cada barra toma el lado y la intensidad de la columna de su celda', () => {
      render([zone('own', 1, 0, 10, 2, 1), zone('mid', 1, 10, 20, 2, 3), zone('rival', 1, 20, 40, 2, 6)]);

      const bars = segments();

      expect(bars.map(bar => bar.classList.contains('terr-rival'))).toEqual([false, false, true]);
      expect(bars.map(bar => bar.style.getPropertyValue('--terr-w'))).toEqual(['1', '0.2', '1']);
    });

    it('muestra la leyenda "Campo propio ← → Campo rival"', () => {
      render([]);

      expect(fixture.nativeElement.querySelector('[data-testid="territory-legend"]')?.textContent).toContain('Campo rival');
    });
  });

  describe('vínculo con la cancha', () => {
    it('resalta los tramos de la celda indicada y atenúa los demás', () => {
      render([zone('a', 1, 0, 10, 2, 3), zone('b', 1, 10, 20, 1, 1)]);
      fixture.componentRef.setInput('highlightCell', { row: 2, col: 3 });
      fixture.detectChanges();

      expect(segments().map(bar => [bar.classList.contains('is-linked'), bar.classList.contains('is-dimmed')]))
        .toEqual([[true, false], [false, true]]);
    });

    it('sin celda resaltada no atenúa nada', () => {
      render([zone('a', 1, 0, 10)]);

      expect(segments()[0].classList).not.toContain('is-dimmed');
    });

    it('avisa qué tramo está bajo el cursor y cuándo lo deja', () => {
      render([zone('a', 1, 0, 10)]);
      const hovered: (string | null)[] = [];
      fixture.componentInstance.segmentHover.subscribe(id => hovered.push(id));

      segments()[0].dispatchEvent(new Event('mouseenter'));
      segments()[0].dispatchEvent(new Event('mouseleave'));

      expect(hovered).toEqual(['a', null]);
    });
  });

  describe('vista previa del rango', () => {
    const preview = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-testid="range-preview"]');

    it('dibuja el rango del formulario en su posición y ancho', () => {
      render([]);
      fixture.componentRef.setInput('previewRange', { period: 1, startMinute: 20, endMinute: 30 });
      fixture.detectChanges();

      expect(preview()?.style.left).toBe('25%');
      expect(preview()?.style.width).toBe('12.5%');
    });

    it('sin rango cargado no dibuja nada', () => {
      render([]);

      expect(preview()).toBeNull();
    });
  });
});
