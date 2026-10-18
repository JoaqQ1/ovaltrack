package com.ovaltrack.backend.invitations.domain;

import java.util.UUID;

public record InvitationValidationResponse(
        Action action,
        UUID personId,
        UUID divisionId) {
}