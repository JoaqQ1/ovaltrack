package com.ovaltrack.backend.statistic.domain.dto;

import java.util.UUID;

public record PeriodStatisticDTO(
    UUID matchId,
    Integer period,
    int ownScore,
    int opponentScore,
    int ownTries,
    int opponentTries,
    int ownConversions,
    int opponentConversions,
    int ownPenalties,
    int opponentPenalties,
    int ownDropGoals,
    int opponentDropGoals,
    int ownTacklesCompleted,
    int ownTacklesMissed,
    double ownTackleEffectiveness,
    int ownTurnoversWon,
    int ownTurnoversLost,
    int ownPenaltiesConceded,
    int opponentPenaltiesConceded,
    int ownYellowCards,
    int opponentYellowCards,
    int ownRedCards,
    int opponentRedCards,
    int scrumsTotal,
    int lineoutsTotal,
    double ownPossessionPercentage
) {
}
