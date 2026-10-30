import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoneGapSelection, ZoneTimelineComponent } from './zone-timeline.component';
import { ZoneAssignmentResponse } from '../../../types/zone.types';

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
});
