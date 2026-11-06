package com.ovaltrack.backend.match.domain.dto;

import java.util.UUID;

import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchPlayerStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchRosterPlayerDTO {
    private UUID id;
    private String fullName;
    private MatchPlayerRole role;
    private String position;
    private Integer number;
    private MatchPlayerStatus fieldStatus;
    private Integer fieldSlot;
    private Integer slotOrder;
}
