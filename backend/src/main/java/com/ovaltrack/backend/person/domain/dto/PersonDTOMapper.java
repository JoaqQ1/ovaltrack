package com.ovaltrack.backend.person.domain.dto;

import com.ovaltrack.backend.person.domain.Person;

public final class PersonDTOMapper {

    private PersonDTOMapper() {
    }

    public static PersonResponseDTO toResponseDTO(Person person) {
        if (person == null) {
            return null;
        }

        return new PersonResponseDTO(
                person.getId(),
                person.getFirstName(),
                person.getLastName(),
                person.getBirthDate(),
                person.getContactEmail(),
                person.getContactPhone(),
                person.getCreatedAt()
        );
    }

    public static Person toEntity(PersonCreationDTO dto) {
        if (dto == null) {
            return null;
        }

        return Person.builder()
                .firstName(dto.firstName())
                .lastName(dto.lastName())
                .birthDate(dto.birthDate())
                .contactEmail(dto.contactEmail())
                .contactPhone(dto.contactPhone())
                .build();
    }
}
