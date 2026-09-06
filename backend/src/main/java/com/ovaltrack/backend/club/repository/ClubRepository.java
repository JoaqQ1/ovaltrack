package com.ovaltrack.backend.club.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ovaltrack.backend.club.domain.Club;

public interface ClubRepository extends JpaRepository<Club, UUID>{
}
