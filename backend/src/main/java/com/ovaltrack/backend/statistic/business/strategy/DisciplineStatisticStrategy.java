package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular penales concedidos, tarjetas amarillas y tarjetas rojas.
 */
@Component
public class DisciplineStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int ownPenaltiesConceded = 0;
        int opponentPenaltiesConceded = 0;
        int ownYellowCards = 0;
        int opponentYellowCards = 0;
        int ownRedCards = 0;
        int opponentRedCards = 0;

        for (Event event : periodEvents) {
            boolean isOwn = event.getTeamPossession() == EventPossession.OWN;

            switch (event.getEventTypeName()) {
                case "Penal / infracción" -> {
                    if (isOwn) {
                        ownPenaltiesConceded++;
                    } else {
                        opponentPenaltiesConceded++;
                    }
                }
                case "Amonestación" -> {
                    if (isOwn) {
                        ownYellowCards++;
                    } else {
                        opponentYellowCards++;
                    }
                }
                case "Expulsión" -> {
                    if (isOwn) {
                        ownRedCards++;
                    } else {
                        opponentRedCards++;
                    }
                }
                default -> {}
            }
        }

        builder.ownPenaltiesConceded(ownPenaltiesConceded)
               .opponentPenaltiesConceded(opponentPenaltiesConceded)
               .ownYellowCards(ownYellowCards)
               .opponentYellowCards(opponentYellowCards)
               .ownRedCards(ownRedCards)
               .opponentRedCards(opponentRedCards);
    }
}
