package com.ovaltrack.backend.division.domain.dto;

import com.ovaltrack.backend.division.domain.Division;

public final class DivisionDTOMapper {

	public static DivisionResponseDTO toResponseDTO(Division division) {
		return new DivisionResponseDTO(
				division.getId(),
				division.getName(),
				division.getClub().getId(),
				division.getCreatedAt(),
				division.getAgeCategory(),
				division.getGender(),
				division.getActive()
		);
	}
}
