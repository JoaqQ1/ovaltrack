package com.ovaltrack.backend.match.repository;

import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MatchPlayerRepository extends JpaRepository<MatchPlayer, UUID> {
    void deleteByMatch(Match match); 
}