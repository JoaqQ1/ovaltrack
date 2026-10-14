package com.ovaltrack.backend.club.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.club.domain.ClubStatus;

public interface ClubRepository extends JpaRepository<Club, UUID> {
    boolean existsByAdminUserId(UUID adminUserId);
    Optional<Club> findByAdminUserId(UUID adminUserId);
    Optional<Club> findByAdminUserLoginEmail(String loginEmail);
    List<Club> findAllByStatus(@Param("status") ClubStatus status);
    @Query(value="""
            SELECT c
            FROM Club c
            WHERE UPPER(c.name) LIKE :term OR UPPER(c.city) LIKE :term
            AND c.status = 'ACTIVE'
            """)
    Collection<Club>search(@Param ("term")String term);
}
