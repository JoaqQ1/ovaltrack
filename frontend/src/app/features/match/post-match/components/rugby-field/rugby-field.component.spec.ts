import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RugbyFieldComponent } from './rugby-field.component';
import { ZoneCellRef, ZoneCellSummary } from '../../../types/zone.types';

describe('RugbyFieldComponent', () => {
  let fixture: ComponentFixture<RugbyFieldComponent>;

  const cells = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[data-testid="zone-cell"]'));

  const cellAt = (row: number, col: number): HTMLElement | undefined =>
    cells().find(c => c.dataset['row'] === String(row) && c.dataset['col'] === String(col));

  const render = (summary: ZoneCellSummary[], unzoned = 0): void => {
    fixture.componentRef.setInput('cells', summary);
    fixture.componentRef.setInput('unzonedEventCount', unzoned);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RugbyFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(RugbyFieldComponent);
  });

  it('dibuja siempre la grilla completa de 3 filas x 6 columnas', () => {
    render([]);

    expect(cells().length).toBe(18);
  });

  it('muestra el conteo de eventos en la celda correspondiente', () => {
    render([{ row: 2, col: 3, eventCount: 4 }]);

    expect(cellAt(2, 3)?.textContent).toContain('4');
  });

  it('no muestra conteo en las celdas sin eventos', () => {
    render([{ row: 2, col: 3, eventCount: 4 }]);

    expect(cellAt(1, 1)?.querySelector('[data-testid="zone-count"]')).toBeNull();
  });

  it('marca como activas únicamente las celdas con eventos', () => {
    render([{ row: 2, col: 3, eventCount: 4 }]);

    expect(cellAt(2, 3)?.classList).toContain('has-events');
    expect(cellAt(3, 6)?.classList).not.toContain('has-events');
  });

  it('informa los eventos sin zona cuando existen', () => {
    render([], 3);

    const notice = fixture.nativeElement.querySelector('[data-testid="unzoned-notice"]');
    expect(notice?.textContent).toContain('3');
  });

  it('oculta el aviso de sin zona cuando todos los eventos tienen zona', () => {
    render([{ row: 1, col: 1, eventCount: 2 }], 0);

    expect(fixture.nativeElement.querySelector('[data-testid="unzoned-notice"]')).toBeNull();
  });

  it('muestra un estado vacío cuando no hay ninguna zona asignada', () => {
    render([], 0);

    expect(fixture.nativeElement.querySelector('[data-testid="zones-empty"]')).not.toBeNull();
  });

  describe('selección de zona', () => {
    it('emite la celda tocada', () => {
      render([]);
      const emitted: ZoneCellRef[] = [];
      fixture.componentInstance.cellSelected.subscribe(cell => emitted.push(cell));

      cellAt(2, 3)?.dispatchEvent(new Event('click'));

      expect(emitted).toEqual([{ row: 2, col: 3 }]);
    });

    it('emite la celda con Enter y con Espacio desde el teclado', () => {
      render([]);
      const emitted: ZoneCellRef[] = [];
      fixture.componentInstance.cellSelected.subscribe(cell => emitted.push(cell));

      cellAt(1, 1)?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      cellAt(3, 6)?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      expect(emitted).toEqual([{ row: 1, col: 1 }, { row: 3, col: 6 }]);
    });

    it('marca únicamente la celda seleccionada', () => {
      fixture.componentRef.setInput('selectedCell', { row: 2, col: 3 });
      render([]);

      expect(cellAt(2, 3)?.classList).toContain('is-selected');
      expect(cellAt(1, 1)?.classList).not.toContain('is-selected');
      expect(cellAt(2, 3)?.getAttribute('aria-pressed')).toBe('true');
    });

    it('no emite si el gráfico es de solo lectura', () => {
      fixture.componentRef.setInput('selectable', false);
      render([]);
      const emitted: ZoneCellRef[] = [];
      fixture.componentInstance.cellSelected.subscribe(cell => emitted.push(cell));

      cellAt(2, 3)?.dispatchEvent(new Event('click'));

      expect(emitted).toEqual([]);
    });
  });

  describe('proporciones reglamentarias', () => {
    it('las columnas suman 120 m y respetan 10 / 22 / 28 / 28 / 22 / 10', () => {
      render([]);
      const columns = fixture.componentInstance.columns;

      expect(columns.map(c => c.meters)).toEqual([10, 22, 28, 28, 22, 10]);
      expect(columns.reduce((sum, c) => sum + c.meters, 0)).toBe(120);
      expect(fixture.componentInstance.width).toBe(1200);
      expect(fixture.componentInstance.height).toBe(700);
    });

    it('la línea de mitad de cancha queda en el centro', () => {
      render([]);

      expect(fixture.componentInstance.halfway).toBe(fixture.componentInstance.width / 2);
    });
  });
});
