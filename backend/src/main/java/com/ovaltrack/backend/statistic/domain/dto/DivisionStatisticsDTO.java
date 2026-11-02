package com.ovaltrack.backend.statistic.domain.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Respuesta de GET /statistics/division/{divisionId}: partidos finalizados del rango, ordenados por fecha. */
public record DivisionStatisticsDTO(
    UUID divisionId,
    String divisionName,
    LocalDate from,
    LocalDate to,
    List<DivisionMatchStatisticDTO> matches
) {
}
