package com.ovaltrack.backend.club.domain.dto;

import com.ovaltrack.backend.club.domain.ClubStatus;

import java.util.UUID;

public record ClubResponseDTO(
	UUID id,

	String name,

    ClubStatus status,

    UUID adminUserId,

    String city,

    String logoUrl,

    String contactEmail,
    
    String contactPhone
) {
}
