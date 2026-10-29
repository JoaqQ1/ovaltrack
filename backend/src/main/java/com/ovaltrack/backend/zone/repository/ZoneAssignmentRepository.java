package com.ovaltrack.backend.zone.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ovaltrack.backend.zone.domain.ZoneAssignment;

public interface ZoneAssignmentRepository extends JpaRepository<ZoneAssignment, UUID> {

    List<ZoneAssignment> findByMatchIdOrderByPeriodAscStartMinuteAsc(UUID matchId);

    Optional<ZoneAssignment> findByIdAndMatchId(UUID id, UUID matchId);
}
