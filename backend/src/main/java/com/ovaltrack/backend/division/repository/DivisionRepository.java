package com.ovaltrack.backend.division.repository;

import java.util.Collection;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.division.domain.Division;

public interface DivisionRepository extends JpaRepository<Division, UUID>{

    @Query("SELECT d FROM Division d WHERE d.club.id = :clubId")
    Collection<Division> findAllDivisionsByClubId(@Param("clubId") UUID clubId);

/* 
    @Query("SELECT d FROM Division d WHERE d.club.id = :clubId AND d.name = :name")
    Division findByNameAndClubId(@Param("name") String name, @Param("clubId") UUID clubId);
 */

    @Query("SELECT d FROM Division d WHERE d.club.id = :clubId AND UPPER(d.name) = :name AND d.active = true")
    Division findByNameAndClubId(@Param("name") String name, @Param("clubId") UUID clubId);

}
