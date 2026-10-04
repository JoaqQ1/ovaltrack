package com.ovaltrack.backend.auth.admin.controller;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.auth.admin.dto.OvalTrackAdminOverviewDTO;
import com.ovaltrack.backend.auth.admin.dto.RegistrationDecisionRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.service.AdminService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.dto.response.BackendResponse;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.dto.UserResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/ovaltrack")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_OVALTRACK')")
public class OvalTrackAdminController {

    private final AdminService adminService;
    private final UserService userService;

    @GetMapping("/overview")
    public ResponseEntity<BackendResponse<OvalTrackAdminOverviewDTO>> getOverview() {
        List<RegistrationRequest> registrationRequests = adminService.findAll();
        Collection<UserResponseDTO> users = userService.findAllUsersExceptAdminOvaltrack();
        OvalTrackAdminOverviewDTO overview = new OvalTrackAdminOverviewDTO(
                registrationRequests,
                users);
        return BackendResponse.ok(overview);
    }

    @PostMapping("/registration-requests/{requestId}/approve")
    public ResponseEntity<BackendResponse<RegistrationRequest>> approveClubRequest(
            @PathVariable UUID requestId,
            Authentication authentication) {
        RegistrationRequest request = adminService.approveRequest(
                requestId,
                userService.findUserByEmail(authentication.getName()));
        return BackendResponse.ok(request, "El registro fue aprobado con exito!");
    }

    @PostMapping("/registration-requests/{requestId}/reject")
    public ResponseEntity<Void> rejectClubRequest(
            @PathVariable UUID requestId,
            @RequestBody RegistrationDecisionRequest request,
            Authentication authentication) {
        adminService.rejectClubRequest(
                requestId,
                userService.findUserByEmail(authentication.getName()),
                request == null ? null : request.comment());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<BackendResponse<Object>> activateUser(@PathVariable UUID id) {
        try {
            adminService.activateAccount(id);
        } catch (BusinessException e) {
            return BackendResponse.response(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (IllegalStateException e) {
            return BackendResponse.response(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }

        return BackendResponse.ok(null, "La cuenta del usuario a sido activada correctamente.");
    }

    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<BackendResponse<Object>> deactivateUser(@PathVariable UUID id) {
        try {
            adminService.deactivateAccount(id);
        } catch (BusinessException e) {
            return BackendResponse.response(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (IllegalStateException e) {
            return BackendResponse.response(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }

        return BackendResponse.ok(null, "La cuenta del usuario a sido desactivada correctamente.");
    }

}