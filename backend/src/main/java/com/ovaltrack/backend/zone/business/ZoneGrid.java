package com.ovaltrack.backend.zone.business;

/**
 * Geometría fija de la zonificación: 3 filas (ancho de la cancha) x 6 columnas (ingoal, 22, mitad, mitad, 22, ingoal)
 * y la duración reglamentaria de cada tiempo. Es el único lugar donde viven estas constantes.
 */
public final class ZoneGrid {

    public static final int ROWS = 3;
    public static final int COLS = 6;
    public static final int HALF_MINUTES = 40;
    public static final int PERIODS = 2;

    private ZoneGrid() {
    }

    public static boolean isValidCell(int row, int col) {
        return row >= 1 && row <= ROWS && col >= 1 && col <= COLS;
    }

    /** Minuto de partido en el que empieza el período (1T: 0, 2T: 40). */
    public static int periodStartMinute(int period) {
        return (period - 1) * HALF_MINUTES;
    }

    /** Minuto de partido en el que termina el período (1T: 40, 2T: 80). */
    public static int periodEndMinute(int period) {
        return period * HALF_MINUTES;
    }
}
