package com.ovaltrack.backend.user.domain.dto;

import com.ovaltrack.backend.user.domain.User;

public final class UserDTOMapper {

    private UserDTOMapper() {
    }

    public static UserResponseDTO toResponseDTO(User user) {
        if (user == null) {
            return null;
        }

        return new UserResponseDTO(
            user.getId(),
            user.getLoginEmail(),
            user.getRole(),
            user.getActive(),
            user.getPerson() != null ? user.getPerson().getId() : null,
            user.getPerson() != null ? user.getPerson().getFirstName() : null,
            user.getPerson() != null ? user.getPerson().getLastName() : null,
            user.getCreatedAt()
        );
    }
}
