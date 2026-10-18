package com.ovaltrack.backend.division.domain.dto.divisionplayerdto;

import java.time.LocalDate;
import java.util.UUID;

import com.ovaltrack.backend.user.domain.UserRole;
import com.ovaltrack.backend.user.domain.UserStatus;

public record DivisionPlayerPersonUserResponseDTO(
        UUID divisionPlayerId,
        UUID personId,
        UUID divisionId,
        Integer jerseyNumber,
        String position,
        LocalDate startDate,
        LocalDate endDate,
        String firstName,
        String lastName,
        LocalDate birthDate,
        String contactEmail,
        String contactPhone,
        UUID userId,
        String loginEmail,
        UserRole role,
        UserStatus accountStatus,
        Boolean active
) {
}
