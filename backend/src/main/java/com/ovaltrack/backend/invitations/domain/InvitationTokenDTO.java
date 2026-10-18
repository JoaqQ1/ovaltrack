package com.ovaltrack.backend.invitations.domain;

import jakarta.validation.constraints.NotBlank;

public record InvitationTokenDTO(
    @NotBlank(message = "El token no puede estar vacío") 
    String token
) {
}