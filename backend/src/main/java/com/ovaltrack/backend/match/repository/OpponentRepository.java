package com.ovaltrack.backend.match.repository;

import com.ovaltrack.backend.match.domain.Opponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OpponentRepository extends JpaRepository<Opponent, UUID> {

    boolean existsByNameIgnoreCase(String name);
}