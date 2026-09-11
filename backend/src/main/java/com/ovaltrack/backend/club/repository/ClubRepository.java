package com.ovaltrack.backend.club.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ovaltrack.backend.club.domain.Club;

public interface ClubRepository extends JpaRepository<Club, UUID> {
    boolean existsByAdminUserId(UUID adminUserId);
    Optional<Club> findByAdminUserId(UUID adminUserId);
    Optional<Club> findByAdminUserLoginEmail(String loginEmail);
}
