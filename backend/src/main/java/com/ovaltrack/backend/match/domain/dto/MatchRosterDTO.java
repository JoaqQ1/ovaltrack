package com.ovaltrack.backend.match.domain.dto;

import java.util.List;

public record MatchRosterDTO(
    List<MatchRosterEntryDTO> titulares,
    List<MatchRosterEntryDTO> suplentes
) {}