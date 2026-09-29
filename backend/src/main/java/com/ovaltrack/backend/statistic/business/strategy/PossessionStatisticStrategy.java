package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular el porcentaje de posesión neta del equipo propio.
 */
@Component
public class PossessionStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int ownPossessionCount = 0;
        int opponentPossessionCount = 0;

        for (Event event : periodEvents) {
            EventPossession possession = event.getTeamPossession();
            if (possession == EventPossession.OWN) {
                ownPossessionCount++;
            } else if (possession == EventPossession.OPPONENT) {
                opponentPossessionCount++;
            }
        }

        int totalPossession = ownPossessionCount + opponentPossessionCount;
        double ownPossessionPercentage = totalPossession > 0
                ? Math.round(((double) ownPossessionCount / totalPossession) * 1000.0) / 10.0
                : 50.0;

        builder.ownPossessionPercentage(ownPossessionPercentage);
    }
}
