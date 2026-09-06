package com.ovaltrack.backend.division.repository;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.division.domain.DivisionPlayer;

public interface DivisionPlayerRepository extends JpaRepository<DivisionPlayer, UUID> {

	@Query("SELECT dp FROM DivisionPlayer dp WHERE dp.division.id = :divisionId")
	Collection<DivisionPlayer> findDivisionPlayersByDivision(@Param("divisionId") UUID divisionId);

	@Query("SELECT dp FROM DivisionPlayer dp WHERE dp.id = :divisionPlayerId AND dp.division.id = :divisionId")
	DivisionPlayer findDivisionPlayerByIdAndDivisionId(@Param("divisionPlayerId") UUID divisionPlayerId,
			@Param("divisionId") UUID divisionId);
}