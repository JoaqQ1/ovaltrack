package com.ovaltrack.backend.match.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.repository.MatchRepository;

import jakarta.transaction.Transactional;

@Service
public class MatchService {

	@Autowired
	private MatchRepository matchRepository;

	public Collection<Match> findAllMatches() {
		return matchRepository.findAll();
	}

	public Match findMatchById(UUID matchId) {
		return matchRepository.findById(matchId).orElse(null);
	}

	@Transactional
	public Match saveMatch(Match match) {
		return matchRepository.save(match);
	}

	@Transactional
	public void deleteMatch(UUID matchId) {
		matchRepository.deleteById(matchId);
	}
}
