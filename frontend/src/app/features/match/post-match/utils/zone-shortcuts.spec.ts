import { ZONE_SHORTCUT_HELP, ZONE_SHORTCUT_ROWS, isSaveShortcut, isTypingTarget, shortcutCell } from './zone-shortcuts';

describe('zone-shortcuts', () => {
  describe('shortcutCell', () => {
    it('F2-H9. cada fila del teclado recorre las 6 columnas de una fila de la cancha', () => {
      expect(shortcutCell('q')).toEqual({ row: 1, col: 1 });
      expect(shortcutCell('y')).toEqual({ row: 1, col: 6 });
      expect(shortcutCell('a')).toEqual({ row: 2, col: 1 });
      expect(shortcutCell('h')).toEqual({ row: 2, col: 6 });
      expect(shortcutCell('z')).toEqual({ row: 3, col: 1 });
      expect(shortcutCell('n')).toEqual({ row: 3, col: 6 });
    });

    it('no distingue mayúsculas y cubre las 18 celdas sin repetir ninguna', () => {
      const cells = ZONE_SHORTCUT_ROWS.flat().map(key => shortcutCell(key.toLowerCase()));

      expect(cells.every(cell => cell !== null)).toBeTrue();
      expect(new Set(cells.map(cell => `${cell?.row}-${cell?.col}`)).size).toBe(18);
      expect(shortcutCell('Q')).toEqual(shortcutCell('q'));
    });

    it('las teclas que no son atajos devuelven null', () => {
      expect(shortcutCell('Enter')).toBeNull();
      expect(shortcutCell('1')).toBeNull();
      expect(shortcutCell('p')).toBeNull();
    });
  });

  it('la ayuda lista cada fila con su nombre y sus teclas', () => {
    expect(ZONE_SHORTCUT_HELP).toEqual([
      { rowName: 'Izquierda', keys: 'Q W E R T Y' },
      { rowName: 'Centro', keys: 'A S D F G H' },
      { rowName: 'Derecha', keys: 'Z X C V B N' }
    ]);
  });

  describe('isTypingTarget', () => {
    it('F2-S4. inputs, textareas, selects y elementos editables son campos de escritura', () => {
      expect(isTypingTarget({ tagName: 'INPUT' } as unknown as EventTarget)).toBeTrue();
      expect(isTypingTarget({ tagName: 'textarea' } as unknown as EventTarget)).toBeTrue();
      expect(isTypingTarget({ tagName: 'SELECT' } as unknown as EventTarget)).toBeTrue();
      expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget)).toBeTrue();
    });

    it('un botón, el body o ningún objetivo no lo son', () => {
      expect(isTypingTarget({ tagName: 'BUTTON' } as unknown as EventTarget)).toBeFalse();
      expect(isTypingTarget({ tagName: 'BODY' } as unknown as EventTarget)).toBeFalse();
      expect(isTypingTarget(null)).toBeFalse();
    });
  });

  describe('isSaveShortcut', () => {
    it('Ctrl o Cmd + Enter guardan; Enter solo no', () => {
      expect(isSaveShortcut({ key: 'Enter', ctrlKey: true, metaKey: false })).toBeTrue();
      expect(isSaveShortcut({ key: 'Enter', ctrlKey: false, metaKey: true })).toBeTrue();
      expect(isSaveShortcut({ key: 'Enter', ctrlKey: false, metaKey: false })).toBeFalse();
      expect(isSaveShortcut({ key: 's', ctrlKey: true, metaKey: false })).toBeFalse();
    });
  });
});
