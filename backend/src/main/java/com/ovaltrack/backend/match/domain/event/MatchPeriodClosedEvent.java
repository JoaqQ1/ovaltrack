package com.ovaltrack.backend.match.domain.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record MatchPeriodClosedEvent(
    UUID matchId,
    Integer periodClosed,
    LocalDateTime closedAt
) {
}
