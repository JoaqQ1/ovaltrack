import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoneEventsListComponent } from './zone-events-list.component';
import { MatchTimelineEventResponse } from '../../../types/event.types';

describe('ZoneEventsListComponent', () => {
  let fixture: ComponentFixture<ZoneEventsListComponent>;

  const event = (id: string, minute: number, playerName: string | null = null): MatchTimelineEventResponse => ({
    id, eventTypeId: 't', eventTypeName: 'Tackle completado', matchTime: minute * 60, period: minute >= 40 ? 2 : 1,
    teamPossession: 'OWN', playerName
  });

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('[data-testid="event-row"]'));
  const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ZoneEventsListComponent] }).compileComponents();
    fixture = TestBed.createComponent(ZoneEventsListComponent);
  });

  it('lista cada evento con su minuto, tiempo, tipo y jugador', () => {
    fixture.componentRef.setInput('events', [event('a', 12, 'Juan Pérez')]);
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('12:00');
    expect(rows()[0].textContent).toContain('1T');
    expect(rows()[0].textContent).toContain('Tackle completado');
    expect(rows()[0].textContent).toContain('Juan Pérez');
  });

  it('usa los minutos acumulados del 2T y marca los eventos sin jugador', () => {
    fixture.componentRef.setInput('events', [event('b', 50)]);
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('50:00');
    expect(rows()[0].textContent).toContain('2T');
    expect(rows()[0].textContent).toContain('Sin jugador');
  });

  it('muestra el contador y el título recibidos', () => {
    fixture.componentRef.setInput('title', 'Eventos en C3');
    fixture.componentRef.setInput('events', [event('a', 1), event('b', 2)]);
    fixture.detectChanges();

    expect(text('.section-title')).toBe('Eventos en C3');
    expect(text('[data-testid="events-count"]')).toBe('2');
  });

  it('con una pista no lista nada y oculta el contador', () => {
    fixture.componentRef.setInput('hint', 'Tocá una zona');
    fixture.componentRef.setInput('events', [event('a', 1)]);
    fixture.detectChanges();

    expect(text('[data-testid="events-hint"]')).toBe('Tocá una zona');
    expect(rows().length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="events-count"]')).toBeNull();
  });

  it('sin eventos muestra el texto de vacío', () => {
    fixture.componentRef.setInput('emptyText', 'No hay eventos en esta selección.');
    fixture.detectChanges();

    expect(text('[data-testid="events-empty"]')).toBe('No hay eventos en esta selección.');
  });

  it('muestra el subtítulo cuando existe', () => {
    fixture.componentRef.setInput('subtitle', 'C3 · Centro · Campo propio');
    fixture.detectChanges();

    expect(text('[data-testid="events-subtitle"]')).toBe('C3 · Centro · Campo propio');
  });
});
