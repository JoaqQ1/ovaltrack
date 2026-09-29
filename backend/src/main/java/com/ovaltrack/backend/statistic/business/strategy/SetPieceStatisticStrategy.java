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
        int scrumsTotal = 0;
        int lineoutsTotal = 0;

        for (Event event : periodEvents) {
            String typeName = event.getEventType() != null ? event.getEventType().getName() : "";
            if ("Scrum".equals(typeName)) {
                scrumsTotal++;
            } else if ("Line-out".equals(typeName) || "Line".equals(typeName)) {
                lineoutsTotal++;
            }
        }

        builder.scrumsTotal(scrumsTotal)
               .lineoutsTotal(lineoutsTotal);
    }
}
