package com.ovaltrack.backend.match.domain.dto;

import java.util.List;
import java.util.UUID;

public record MatchRosterDTO(
    List<UUID> titularesIds,
    List<UUID> suplentesIds
) {}