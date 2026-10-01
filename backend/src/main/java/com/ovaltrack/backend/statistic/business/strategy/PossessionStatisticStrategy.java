package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.statistic.business.util.StatisticMathUtils;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular el porcentaje de posesión neta del equipo propio.
 */
@Component
public class PossessionStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int ownPossessionCount = (int) periodEvents.stream()
                .filter(e -> e.getTeamPossession() == EventPossession.OWN)
                .count();
        int opponentPossessionCount = (int) periodEvents.stream()
                .filter(e -> e.getTeamPossession() == EventPossession.OPPONENT)
                .count();

        int totalPossession = ownPossessionCount + opponentPossessionCount;
        double ownPossessionPercentage = StatisticMathUtils.calculatePercentage(
                ownPossessionCount, totalPossession, 50.0);

        builder.ownPossessionPercentage(ownPossessionPercentage);
    }
}
