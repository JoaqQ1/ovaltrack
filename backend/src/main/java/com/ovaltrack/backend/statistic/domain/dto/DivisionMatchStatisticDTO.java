package com.ovaltrack.backend.statistic.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Estadísticas del partido completo (todos los períodos) dentro del dashboard de una división.
 * Reutiliza {@link PeriodStatisticDTO}, el mismo contrato que usa GET /statistics/match/{id}.
 */
public record DivisionMatchStatisticDTO(
    UUID matchId,
    LocalDateTime date,
    String opponentName,
    PeriodStatisticDTO statistics
) {
}
