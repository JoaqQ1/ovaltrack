package com.ovaltrack.backend.invitations.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record InvitationResponse(UUID id, UUID clubId, UUID divisionId,
                                 UUID personId, String email, LocalDateTime sentAt) {
    public static InvitationResponse from(Invitation i) {
        return new InvitationResponse(i.getId(), i.getClub().getId(), i.getDivision().getId(),
                i.getPerson().getId(), i.getToken().getEmail(), i.getSentAt());
    }
}
