package com.ovaltrack.backend.statistic.business.util;

/**
 * Utilidades matemáticas puras para cálculos estadísticos.
 */
public final class StatisticMathUtils {

    private StatisticMathUtils() {}

    /**
     * Calcula un porcentaje seguro con redondeo a 1 decimal, protegiendo contra división por cero.
     *
     * @param part      Valor parcial (numerador).
     * @param total     Valor total (denominador).
     * @param fallback  Valor de retorno en caso de que total <= 0.
     * @return Porcentaje redondeado a 1 decimal.
     */
    public static double calculatePercentage(int part, int total, double fallback) {
        if (total <= 0) {
            return fallback;
        }
        return Math.round(((double) part / total) * 1000.0) / 10.0;
    }
}
