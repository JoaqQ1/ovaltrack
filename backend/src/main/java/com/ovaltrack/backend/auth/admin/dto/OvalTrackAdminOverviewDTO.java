package com.ovaltrack.backend.auth.admin.dto;

import java.util.Collection;
import java.util.List;

import com.ovaltrack.backend.auth.registration.domain.dto.PendingRegistrationRequestDTO;
import com.ovaltrack.backend.user.domain.dto.UserResponseDTO;

public record OvalTrackAdminOverviewDTO(
        List<PendingRegistrationRequestDTO> pendingRequests,
        Collection<UserResponseDTO> activeAccounts) {
}