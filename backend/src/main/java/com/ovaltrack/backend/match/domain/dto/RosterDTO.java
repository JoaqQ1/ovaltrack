package com.ovaltrack.backend.match.domain.dto;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class RosterDTO {
    private List<UUID> startingPlayers;
    private List<UUID> substitutePlayers;
}