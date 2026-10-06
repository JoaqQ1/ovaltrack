package com.ovaltrack.backend.user.domain.dto;

import com.ovaltrack.backend.club.domain.dto.ClubResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@AllArgsConstructor 
@NoArgsConstructor 
public class UserClubRegistration {
    private UserResponseDTO user;
    private ClubResponseDTO club;
}
