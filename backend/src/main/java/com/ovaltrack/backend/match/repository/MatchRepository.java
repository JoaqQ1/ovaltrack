package com.ovaltrack.backend.match.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ovaltrack.backend.match.domain.Match;

public interface MatchRepository extends JpaRepository<Match, UUID> {
}
