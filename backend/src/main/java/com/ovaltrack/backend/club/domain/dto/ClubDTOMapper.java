package com.ovaltrack.backend.club.domain.dto;

import com.ovaltrack.backend.club.domain.Club;

public final class ClubDTOMapper {

	public static ClubResponseDTO toResponseDTO(Club aClub) {
		if (aClub == null) {
			return null;
		}

		return new ClubResponseDTO(
				aClub.getId(),
				aClub.getName(),
				aClub.getStatus(),
				aClub.getAdminUser().getId(),
				aClub.getCity(),
                aClub.getLogoUrl(),
                aClub.getContactEmail(),
                aClub.getContactPhone()
		);
	}
}
