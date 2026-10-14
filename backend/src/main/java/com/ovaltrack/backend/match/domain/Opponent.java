package com.ovaltrack.backend.match.domain;

import java.util.UUID;
import jakarta.persistence.*;
import lombok.*;

@Entity 
@Table(name = "opponents")
@Getter 
@Setter 
@NoArgsConstructor
@AllArgsConstructor 
@Builder
public class Opponent {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String city;
}