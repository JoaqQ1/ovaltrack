package com.ovaltrack.backend.match.domain;

import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.event.domain.EventPossession;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "division_id", nullable = false)
    private Division division;

    private String opponent;

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    @Column(name = "current_period", nullable = false)
    @Builder.Default
    private Integer currentPeriod = 1;

    @Column(name = "clock_elapsed_seconds", nullable = false)
    @Builder.Default
    private Integer clockElapsedSeconds = 0;

    @Column(name = "clock_paused", nullable = false)
    @Builder.Default
    private Boolean clockPaused = true;

    @Column(name = "clock_updated_at")
    private LocalDateTime clockUpdatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_possession", nullable = false)
    @Builder.Default
    private EventPossession currentPossession = EventPossession.OWN;

    @Column(name = "home_score", nullable = false)
    @Builder.Default
    private Integer homeScore = 0;

    @Column(name = "away_score", nullable = false)
    @Builder.Default
    private Integer awayScore = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;


    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MatchPlayer> roster = new ArrayList<>();
}
