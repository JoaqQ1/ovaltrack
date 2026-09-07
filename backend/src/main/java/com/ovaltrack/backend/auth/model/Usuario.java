package com.ovaltrack.backend.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "usuarios_temp")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // Se guardará el HASH, nunca texto plano

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    // Provisorios para validar pertenencia a club y división
    private Long clubId;     // Nullable si es ADMIN_OVALTRACK
    private Long divisionId; // Nullable si aplica a todo el club o es admin
}
