package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Contrato base para las estrategias de cálculo de estadísticas de período.
 * Cada implementación se enfoca en un único aspecto del juego (SRP).
 */
public interface PeriodStatisticStrategy {

    /**
     * Procesa la colección de eventos del período y asigna los resultados al builder.
     *
     * @param periodEvents colección de eventos filtrados para el período.
     * @param builder builder del DTO de estadísticas a poblar.
     */
    void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder);
}
