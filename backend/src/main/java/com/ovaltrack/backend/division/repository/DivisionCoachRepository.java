package com.ovaltrack.backend.division.repository;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.division.domain.DivisionCoach;

public interface DivisionCoachRepository extends JpaRepository<DivisionCoach, UUID> {

    @Query("SELECT dc FROM DivisionCoach dc WHERE dc.division.club.id = :clubId AND dc.division.id = :divisionId")
    Collection<DivisionCoach> findDivisionCoachesByClubIdAndDivisionId(@Param("clubId") UUID clubId, @Param("divisionId") UUID divisionId);

    @Query("SELECT dc FROM DivisionCoach dc WHERE dc.id = :divisionCoachId AND dc.division.id = :divisionId")
    DivisionCoach findDivisionCoachByIdAndDivisionId(@Param("divisionCoachId") UUID divisionCoachId,
            @Param("divisionId") UUID divisionId);

}