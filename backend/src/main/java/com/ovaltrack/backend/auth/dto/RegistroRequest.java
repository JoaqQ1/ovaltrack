package com.ovaltrack.backend.auth.dto;

import com.ovaltrack.backend.auth.model.Rol;

public record RegistroRequest(
    String email,
    String password,
    Rol rol,
    Long clubId,
    Long divisionId
) {

}
