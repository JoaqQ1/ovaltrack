package com.ovaltrack.backend.zone.domain;

import java.util.UUID;

import com.ovaltrack.backend.match.domain.Match;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Asigna una celda de la cancha (fila/columna de la grilla) a un rango de minutos de un período
 * del partido. El rango es semiabierto: [startMinute, endMinute).
 */
@Entity
@Table(name = "match_zone_assignments", indexes = {
        @Index(name = "idx_zone_assignments_match", columnList = "match_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ZoneAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(nullable = false)
    private Integer period;

    @Column(name = "start_minute", nullable = false)
    private Integer startMinute;

    @Column(name = "end_minute", nullable = false)
    private Integer endMinute;

    @Column(name = "zone_row", nullable = false)
    private Integer row;

    @Column(name = "zone_col", nullable = false)
    private Integer col;
}
