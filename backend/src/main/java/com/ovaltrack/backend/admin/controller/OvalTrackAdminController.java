package com.ovaltrack.backend.admin.controller;

import java.util.Collection;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.admin.service.AdminService;
import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.ClubStatus;
import com.ovaltrack.backend.club.domain.dto.ClubResponseDTO;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.dto.response.BackendResponse;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.UserStatus;
import com.ovaltrack.backend.user.domain.dto.UserClubRegistration;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/ovaltrack")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN_OVALTRACK')")
public class OvalTrackAdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final ClubService clubService;

    /* ---------- Listados ---------- */

    /** Clubes pendientes de aprobación. */
    @GetMapping("/clubs/pending")
    public ResponseEntity<BackendResponse<Collection<ClubResponseDTO>>> getPendingClubs() {
        return BackendResponse.ok(clubService.findClubByStatus(ClubStatus.PENDING));
    }

    /** Cuentas pendientes de aprobación. */
    @GetMapping("/users/pending")
    public ResponseEntity<BackendResponse<Collection<UserClubRegistration>>> getPendingUsers() {
        return BackendResponse
                .ok(userService.findAllClubRegistrationsByStatusAndActive(UserStatus.PENDING_APPROVAL, null));
    }

    /**
     * Cuentas ya revisadas (excluye pendientes y ADMIN_OVALTRACK).
     * Sin parámetro devuelve activas e inactivas; con ?active=true|false filtra.
     */
    @GetMapping("/users")
    public ResponseEntity<BackendResponse<Collection<UserClubRegistration>>> getUsers(
            @RequestParam(required = false) Boolean active) {
        if (active == null) {
            return BackendResponse.ok(userService.findAllClubRegistrationsByStatusAndActive(null, null));
        }
        return BackendResponse.ok(userService.findAllClubRegistrationsByStatusAndActive(null, active));
    }

    /**
     * Clubes ya revisados. Sin parámetro devuelve ACTIVE y REJECTED;
     * con ?status=ACTIVE o ?status=REJECTED filtra.
     */
    @GetMapping("/clubs")
    public ResponseEntity<BackendResponse<Collection<ClubResponseDTO>>> getClubs(
            @RequestParam(required = false) ClubStatus status) {
        if (status == null) {
            return BackendResponse.ok(clubService.findAllClubs());
        }
        return BackendResponse.ok(clubService.findClubByStatus(status));
    }
    /* ---------- Clubes ---------- */

    @PostMapping("/clubs/{clubId}/approve")
    public ResponseEntity<BackendResponse<Object>> approveClub(
            @PathVariable UUID clubId, 
            @RequestParam UUID adminUserId) {
        adminService.approveClub(clubId,adminUserId);
        return BackendResponse.ok(null, "El club fue aprobado con éxito.");
    }

    @PostMapping("/clubs/{clubId}/reject")
    public ResponseEntity<BackendResponse<Object>> rejectClub(
            @PathVariable UUID clubId,
            Authentication authentication) {
        adminService.rejectClub(clubId);
        return BackendResponse.ok(null, "El club fue rechazado.");
    }

    /* ---------- Cuentas ---------- */

    @PostMapping("/users/{userId}/approve")
    public ResponseEntity<BackendResponse<Object>> approveAccount(
            @PathVariable UUID userId) {
        adminService.approveAccount(userId);
        return BackendResponse.ok(null, "La cuenta fue aprobada con éxito.");
    }

    @PostMapping("/users/{userId}/reject")
    public ResponseEntity<BackendResponse<Object>> rejectAccount(
            @PathVariable UUID userId,
            Authentication authentication) {
        adminService.rejectAccount(userId);
        return BackendResponse.ok(null, "La cuenta fue rechazada.");
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