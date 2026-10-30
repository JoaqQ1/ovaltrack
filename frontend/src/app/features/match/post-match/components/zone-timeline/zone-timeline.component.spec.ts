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

  describe('barra nueva', () => {
    it('lo que ya estaba al cargar no se anima y el tramo recién guardado crece desde la izquierda', () => {
      render([zone('a', 1, 0, 10)]);
      expect(segments().map(bar => bar.classList.contains('is-new'))).toEqual([false]);

      fixture.componentRef.setInput('assignments', [zone('a', 1, 0, 10), zone('b', 1, 10, 20)]);
      fixture.detectChanges();

      expect(segments().map(bar => bar.classList.contains('is-new'))).toEqual([false, true]);
    });

    it('editar un tramo existente no lo trata como nuevo', () => {
      render([zone('a', 1, 0, 10)]);

      fixture.componentRef.setInput('assignments', [zone('a', 1, 0, 15)]);
      fixture.detectChanges();

      expect(segments()[0].classList).not.toContain('is-new');
    });
  });

  describe('arrastre', () => {
    const track = (): HTMLElement => fixture.nativeElement.querySelector('.track');
    const draft = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-testid="range-draft"]');
    const notice = (): string | undefined => fixture.nativeElement.querySelector('[data-testid="drag-notice"]')?.textContent?.trim();
    const handle = (index: number, edge: 'start' | 'end'): HTMLElement =>
      segments()[index].querySelector(`[data-testid="handle-${edge}"]`) as HTMLElement;

    /** La pista mide 800 px: 10 px por minuto. */
    function stubTrack(): void {
      spyOn(track(), 'getBoundingClientRect').and.returnValue(
        { left: 0, top: 0, right: 800, bottom: 52, width: 800, height: 52, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
    }

    function pointer(target: HTMLElement, type: 'pointerdown' | 'pointermove' | 'pointerup', minute: number): void {
      target.dispatchEvent(new PointerEvent(type, { clientX: minute * 10, pointerId: 1, pointerType: 'mouse', button: 0, bubbles: true }));
      fixture.detectChanges();
    }

    it('F2-H2. arrastrar sobre un hueco dibuja un rango provisorio y al soltar lo propone', () => {
      render([]);
      stubTrack();
      const proposed: ZoneGapSelection[] = [];
      fixture.componentInstance.gapSelected.subscribe(range => proposed.push(range));

      pointer(gaps()[0], 'pointerdown', 10);
      pointer(gaps()[0], 'pointermove', 20);
      expect(draft()?.style.left).toBe('12.5%');
      expect(draft()?.style.width).toBe('12.5%');

      pointer(gaps()[0], 'pointerup', 20);

      expect(draft()).toBeNull();
      expect(proposed).toEqual([{ period: 1, startMinute: 10, endMinute: 20 }]);
    });

    it('F2-S1. el arrastre se frena en el entretiempo y muestra el motivo', () => {
      render([]);
      stubTrack();
      const proposed: ZoneGapSelection[] = [];
      fixture.componentInstance.gapSelected.subscribe(range => proposed.push(range));

      pointer(gaps()[0], 'pointerdown', 30);
      pointer(gaps()[0], 'pointermove', 60);

      expect(notice()).toBe('Se frenó en el entretiempo');
      pointer(gaps()[0], 'pointerup', 60);
      expect(proposed).toEqual([{ period: 1, startMinute: 30, endMinute: 40 }]);
    });

    it('F2-S1. se frena en otro tramo y lo nombra', () => {
      render([zone('a', 1, 20, 30)]);
      stubTrack();

      pointer(gaps()[0], 'pointerdown', 5);
      pointer(gaps()[0], 'pointermove', 28);

      expect(notice()).toContain("choca con el tramo 1T 20'–30'");
    });

    it('sin movimiento es un clic: no hay rango arrastrado y el clic normal precarga el hueco', () => {
      render([]);
      stubTrack();
      const proposed: ZoneGapSelection[] = [];
      fixture.componentInstance.gapSelected.subscribe(range => proposed.push(range));

      pointer(gaps()[0], 'pointerdown', 10);
      pointer(gaps()[0], 'pointerup', 10);
      gaps()[0].click();

      expect(proposed.length).toBe(1);
      expect(proposed[0].period).toBe(1);
    });

    it('F2-H3. estirar el borde de un tramo propone el nuevo rango y no se guarda solo', () => {
      render([zone('s', 1, 10, 20)]);
      stubTrack();
      const resized: { startMinute: number; endMinute: number }[] = [];
      const selected: ZoneAssignmentResponse[] = [];
      fixture.componentInstance.segmentResized.subscribe(change => resized.push(change));
      fixture.componentInstance.segmentSelected.subscribe(assignment => selected.push(assignment));

      pointer(handle(0, 'end'), 'pointerdown', 20);
      pointer(handle(0, 'end'), 'pointermove', 26);
      pointer(handle(0, 'end'), 'pointerup', 26);
      segments()[0].click(); // el click posterior al arrastre no debe abrir el tramo

      expect(resized.map(change => [change.startMinute, change.endMinute])).toEqual([[10, 26]]);
      expect(selected).toEqual([]);
    });

    it('las manijas tienen un área táctil de 44 px', () => {
      render([zone('s', 1, 10, 20)]);

      expect(handle(0, 'start').classList).toContain('handle');
      expect(handle(0, 'end').classList).toContain('handle');
    });

    it('en modo lectura no hay manijas y el arrastre no hace nada', () => {
      render([zone('s', 1, 10, 20)], true);

      expect(segments()[0].querySelector('.handle')).toBeNull();
      stubTrack();
      pointer(gaps()[0], 'pointerdown', 25);
      pointer(gaps()[0], 'pointermove', 35);
      expect(draft()).toBeNull();
    });
  });
});
