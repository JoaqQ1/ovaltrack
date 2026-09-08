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

	@Query("SELECT COUNT(dp) > 0 FROM DivisionPlayer dp "
			+ "WHERE dp.division.id = :divisionId AND dp.user.id = :userId "
			+ "AND dp.endDate IS NULL")
	boolean existsActiveAssociation(@Param("divisionId") UUID divisionId,
			@Param("userId") UUID userId);
}