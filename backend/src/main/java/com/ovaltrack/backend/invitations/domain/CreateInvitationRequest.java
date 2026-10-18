package com.ovaltrack.backend.invitations.domain;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;


import jakarta.validation.constraints.NotNull;

public record CreateInvitationRequest(
    @JsonProperty("divisionId") @NotNull(message = "La división es obligatoria") UUID divisionId,
    @JsonProperty("personId")   @NotNull(message = "La persona es obligatoria")  UUID personId
) {}
