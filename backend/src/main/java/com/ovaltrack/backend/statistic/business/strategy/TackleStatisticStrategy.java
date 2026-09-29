package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular tackles completados, fallados y efectividad porcentual.
 */
@Component
public class TackleStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int ownTacklesCompleted = 0;
        int ownTacklesMissed = 0;

        for (Event event : periodEvents) {
            if (event.getTeamPossession() != EventPossession.OWN) {
                continue;
            }

            String typeName = event.getEventType() != null ? event.getEventType().getName() : "";
            if ("Tackle completado".equals(typeName)) {
                ownTacklesCompleted++;
            } else if ("Tackle fallado".equals(typeName)) {
                ownTacklesMissed++;
            }
        }

        int totalTackles = ownTacklesCompleted + ownTacklesMissed;
        double ownTackleEffectiveness = totalTackles > 0
                ? Math.round(((double) ownTacklesCompleted / totalTackles) * 1000.0) / 10.0
                : 0.0;

        builder.ownTacklesCompleted(ownTacklesCompleted)
               .ownTacklesMissed(ownTacklesMissed)
               .ownTackleEffectiveness(ownTackleEffectiveness);
    }
}
