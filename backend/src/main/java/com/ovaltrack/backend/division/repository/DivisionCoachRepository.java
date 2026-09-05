package com.ovaltrack.backend.division.repository;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.division.domain.DivisionCoach;

public interface DivisionCoachRepository extends JpaRepository<DivisionCoach, UUID> {

    @Query("SELECT dc FROM DivisionCoach dc WHERE dc.division.id = :divisionId")
    Collection<DivisionCoach> findDivisionCoachesByDivisionId(@Param("divisionId") UUID divisionId);

}