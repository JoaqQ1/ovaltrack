package com.ovaltrack.backend.match.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.repository.MatchRepository;

import jakarta.transaction.Transactional;

@Service
public class MatchService {

	@Autowired
	private MatchRepository matchRepository;

	public Collection<Match> findAllMatchesByClubId(UUID clubId) {
        return matchRepository.findAllMatchesByClubId(clubId);
    }

	public Collection<Match> findAllMatchesByDivisionId(UUID divisionId) {
        return matchRepository.findAllMatchesByDivisionId(divisionId);
    }

	public Match findMatchById(UUID matchId) {
		return matchRepository.findById(matchId).orElse(null);
	}

	@Transactional
	public Match saveMatch(Division aDivision, Match match) {
		match.setDivision(aDivision);
		return matchRepository.save(match);
	}

	@Transactional
	public void deleteMatch(UUID matchId) {
		matchRepository.deleteById(matchId);
	}
}
