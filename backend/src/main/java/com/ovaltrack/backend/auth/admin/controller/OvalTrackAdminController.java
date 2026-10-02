package com.ovaltrack.backend.auth.admin.controller;

import java.util.Collection;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.auth.admin.dto.OvalTrackAdminOverviewDTO;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.dto.PendingRegistrationRequestDTO;
import com.ovaltrack.backend.auth.registration.service.RegistrationRequestService;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.dto.UserResponseDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/admin/ovaltrack")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_OVALTRACK')")
public class OvalTrackAdminController {

    private final RegistrationRequestService registrationRequestService;
    private final UserService userService;

    @GetMapping("/overview")
    public OvalTrackAdminOverviewDTO getOverview() {
        List<PendingRegistrationRequestDTO> requestsOpen = registrationRequestService.findOpenRequests();
        Collection<UserResponseDTO> usersActive = userService.findActiveUsersDTO();
        return new OvalTrackAdminOverviewDTO(
                requestsOpen,
                usersActive);
    }

}