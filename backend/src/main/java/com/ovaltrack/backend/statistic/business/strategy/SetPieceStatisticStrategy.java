package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular formaciones fijas (Scrums y Line-outs).
 */
@Component
public class SetPieceStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int scrumsTotal = (int) periodEvents.stream()
                .filter(e -> "Scrum".equals(e.getEventTypeName()))
                .count();
        int lineoutsTotal = (int) periodEvents.stream()
                .filter(e -> "Line-out".equals(e.getEventTypeName()) || "Line".equals(e.getEventTypeName()))
                .count();

        builder.scrumsTotal(scrumsTotal)
               .lineoutsTotal(lineoutsTotal);
    }
}
