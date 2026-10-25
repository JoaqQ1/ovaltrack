package com.ovaltrack.backend.match.domain.dto;

import java.time.Instant;

/**
 * Atributo opcional de las transiciones de estado de un partido.
 *
 * @param occurredAt momento real de la transición de estados en un partido (ISO-8601 UTC).
 */
public record MatchTransitionDTO(
    Instant occurredAt
) {}
