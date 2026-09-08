package com.ovaltrack.backend.club.domain.dto;

public record ClubUpdateDTO(
    //@NotNull 
    //UUID clubId,
    String name,
    String city,
    String logoUrl,
    String contactEmail,
    String contactPhone
) {
}
