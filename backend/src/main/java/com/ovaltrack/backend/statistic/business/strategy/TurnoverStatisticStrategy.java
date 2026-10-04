package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular los turnovers ganados y perdidos.
 */
@Component
public class TurnoverStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int ownTurnoversWon = 0;
        int ownTurnoversLost = 0;

        for (Event event : periodEvents) {
            if ("Turnover".equals(event.getEventTypeName())) {
                if (event.getTeamPossession() == EventPossession.OWN) {
                    ownTurnoversWon++;
                } else {
                    ownTurnoversLost++;
                }
            }
        }

        builder.ownTurnoversWon(ownTurnoversWon)
               .ownTurnoversLost(ownTurnoversLost);
    }
}
