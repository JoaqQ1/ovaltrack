package com.ovaltrack.backend.invitations.controller;

import java.util.Collection;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.invitations.domain.CreateInvitationRequest;
import com.ovaltrack.backend.invitations.domain.Invitation;
import com.ovaltrack.backend.invitations.domain.InvitationResponse;
import com.ovaltrack.backend.invitations.domain.InvitationTokenDTO;
import com.ovaltrack.backend.invitations.domain.InvitationValidationResponse;
import com.ovaltrack.backend.invitations.service.InvitationService;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("api/invitation")
// @PreAuthorize ("hasAnyRole('ADMIN_CLUB','COACH_ANALYST')")
@AllArgsConstructor
public class InvitationController {
    private InvitationService service;

    @GetMapping
    public ResponseEntity<Collection<Invitation>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }
    @PreAuthorize ("hasAnyRole('ADMIN_CLUB','COACH_ANALYST')")
    @GetMapping("/id/{id}")
    public ResponseEntity<Invitation> findById(@PathVariable("id") UUID id) {
        Invitation invitation = service.findById(id);
        if (invitation == null)
            throw new BusinessException("No se encontro la invitacion con id " + id);
        return ResponseEntity.ok(invitation);
    }
    @PreAuthorize ("hasAnyRole('ADMIN_CLUB','COACH_ANALYST')")
    @PostMapping("/invite")
    public ResponseEntity<InvitationResponse> invite(@RequestBody CreateInvitationRequest invitationRequest) {
        InvitationResponse invitation = service.save(invitationRequest);
        if (invitation == null)
            throw new BusinessException("No se pudo enviar la peticion");
        return ResponseEntity.ok(invitation);
    }

    @PostMapping("/validate")
    public ResponseEntity<InvitationValidationResponse> validate(
            @RequestBody InvitationTokenDTO token) {
        return ResponseEntity.ok(service.validate(token));
    }
}
