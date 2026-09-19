package com.ovaltrack.backend.match.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.match.domain.Match;

public interface MatchRepository extends JpaRepository<Match, UUID> {

    @Query("SELECT m FROM Match m WHERE m.division.club.id = :clubId")
    Collection<Match> findAllMatchesByClubId(@Param("clubId") UUID clubId);

    @Query("SELECT m FROM Match m WHERE m.division.id = :divisionId")
    Collection<Match> findAllMatchesByDivisionId(@Param("divisionId") UUID divisionId);

    @Query("""
        SELECT m
        FROM Match m
        WHERE m.division.id = :divisionId
        AND m.date > :overlapStart
        AND m.date < :newEnd
    """)
    Match findByDivisionIdAndTimeFrame(
        @Param("divisionId") UUID divisionId,
        @Param("overlapStart") LocalDateTime overlapStart,
        @Param("newEnd") LocalDateTime newEnd
    );
}
