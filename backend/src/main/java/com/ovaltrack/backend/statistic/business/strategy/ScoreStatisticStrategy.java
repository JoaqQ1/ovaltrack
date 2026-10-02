package com.ovaltrack.backend.statistic.business.strategy;

import java.util.Collection;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

/**
 * Estrategia encargada de calcular el tanteador y conteo de anotaciones (tries, conversiones, penales y drops).
 */
@Component
public class ScoreStatisticStrategy implements PeriodStatisticStrategy {

    @Override
    public void calculate(Collection<Event> periodEvents, PeriodStatisticDTO.Builder builder) {
        int ownScore = 0;
        int opponentScore = 0;
        int ownTries = 0;
        int opponentTries = 0;
        int ownConversions = 0;
        int opponentConversions = 0;
        int ownPenalties = 0;
        int opponentPenalties = 0;
        int ownDropGoals = 0;
        int opponentDropGoals = 0;

        for (Event event : periodEvents) {
            EventPossession possession = event.getTeamPossession();

            switch (event.getEventTypeName()) {
                case "Try" -> {
                    if (possession == EventPossession.OWN) {
                        ownTries++;
                        ownScore += 5;
                    } else {
                        opponentTries++;
                        opponentScore += 5;
                    }
                }
                case "Conversión", "Conversion" -> {
                    if (possession == EventPossession.OWN) {
                        ownConversions++;
                        ownScore += 2;
                    } else {
                        opponentConversions++;
                        opponentScore += 2;
                    }
                }
                case "Penal a los palos" -> {
                    if (possession == EventPossession.OWN) {
                        ownPenalties++;
                        ownScore += 3;
                    } else {
                        opponentPenalties++;
                        opponentScore += 3;
                    }
                }
                case "Drop gol" -> {
                    if (possession == EventPossession.OWN) {
                        ownDropGoals++;
                        ownScore += 3;
                    } else {
                        opponentDropGoals++;
                        opponentScore += 3;
                    }
                }
                default -> {}
            }
        }

        builder.ownScore(ownScore)
               .opponentScore(opponentScore)
               .ownTries(ownTries)
               .opponentTries(opponentTries)
               .ownConversions(ownConversions)
               .opponentConversions(opponentConversions)
               .ownPenalties(ownPenalties)
               .opponentPenalties(opponentPenalties)
               .ownDropGoals(ownDropGoals)
               .opponentDropGoals(opponentDropGoals);
    }
}
