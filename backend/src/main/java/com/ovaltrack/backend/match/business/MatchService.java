package com.ovaltrack.backend.match.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.match.domain.dto.MatchCreationDTO;
import com.ovaltrack.backend.match.domain.dto.MatchDTOMapper;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;
import com.ovaltrack.backend.match.repository.MatchRepository;

import jakarta.transaction.Transactional;

@Service
public class MatchService {

	@Autowired
	private MatchRepository matchRepository;

	@Autowired 
	private DivisionService divisionService;

	//TODO: Exceptions for non-existent club and non-existent division
	public Collection<MatchResponseDTO> findAllMatchesByClubId(UUID clubId) {
        return matchRepository.findAllMatchesByClubId(clubId).stream().map(MatchDTOMapper:: toResponseDTO).toList();
    }

	public Collection<MatchResponseDTO> findAllMatchesByDivisionId(UUID divisionId) {
		return matchRepository.findAllMatchesByDivisionId(divisionId).stream().map(MatchDTOMapper:: toResponseDTO).toList();
    }

	public MatchResponseDTO findMatchById(UUID matchId) {
		Match result = matchRepository.findById(matchId).orElse(null);
        return MatchDTOMapper.toResponseDTO(result);
	}

	public Match findMatchEntityById(UUID matchId) {
        return matchRepository.findById(matchId).orElse(null);
	}

	@Transactional
	public Match saveMatch(MatchCreationDTO aMatchRequest) {
		Division aDivision = divisionService.findDivisionEntityById(aMatchRequest.divisionId());
		if (aDivision == null) {
			throw new BusinessException("No se puede asociar un partido a una division que no existe");
		}
		Match aMatch = new Match();
		aMatch.setDate(aMatchRequest.date());
		aMatch.setDivision(aDivision);
		aMatch.setOpponent(aMatchRequest.opponent());
		aMatch.setStatus(MatchStatus.NOT_STARTED);

		return matchRepository.save(aMatch);
	}

	//TODO: functions to start and to finish match, add endpoints and logic to check division association
	@Transactional
	public Match startMatch(UUID matchId) {
		Match aMatch = findMatchEntityById(matchId);
		aMatch.setStatus(MatchStatus.IN_PROGRESS);
		return matchRepository.save(aMatch);
	}

	@Transactional
	public Match FinishMatch(UUID matchId) {
		Match aMatch = findMatchEntityById(matchId);
		aMatch.setStatus(MatchStatus.FINISHED);
		return matchRepository.save(aMatch);
	}

	@Transactional
	public void deleteMatch(UUID matchId) {
		matchRepository.deleteById(matchId);
	}
}
