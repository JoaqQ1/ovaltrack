package com.ovaltrack.backend.match.domain.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OpponentDTO {
    private UUID id;
    private String name;
    private String city;      
}