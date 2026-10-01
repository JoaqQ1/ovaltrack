package com.ovaltrack.backend.match.domain;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
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

    public void closeFirstHalf() {
        if (this.status == MatchStatus.HALFTIME || (this.currentPeriod != null && this.currentPeriod == 2)) {
            throw new BusinessException("El primer tiempo ya ha sido cerrado");
        }
        if (this.status != MatchStatus.IN_PROGRESS) {
            throw new BusinessException("El partido no se encuentra en curso en el primer tiempo");
        }
        this.status = MatchStatus.HALFTIME;
        this.currentPeriod = 1;
    }

    public void startSecondHalf() {
        if (this.status != MatchStatus.HALFTIME) {
            throw new BusinessException("El partido no se encuentra en el entretiempo");
        }
        this.status = MatchStatus.IN_PROGRESS;
        this.currentPeriod = 2;
    }
}
