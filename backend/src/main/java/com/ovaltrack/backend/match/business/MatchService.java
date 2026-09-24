package com.ovaltrack.backend.match.business;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.match.domain.dto.MatchCreationDTO;
import com.ovaltrack.backend.match.domain.dto.MatchDTOMapper;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;
import com.ovaltrack.backend.match.domain.dto.MatchUpdateDTO;
import com.ovaltrack.backend.match.repository.MatchRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MatchService {

	private static final int MATCH_DURATION_MINUTES = 90;

	private final MatchRepository matchRepository;
	private final DivisionService divisionService;
	private final ClubService clubService;

	public Collection<MatchResponseDTO> findAllMatchesByClubId(UUID clubId) {
		if (clubService.findClubEntityById(clubId) == null) {
			throw new BusinessException("Club no encontrado");
        }
        return matchRepository.findAllMatchesByClubId(clubId).stream().map(MatchDTOMapper::toResponseDTO).toList();
    }

	public Collection<MatchResponseDTO> findAllMatchesByDivisionId(UUID divisionId) {
		if (divisionService.findDivisionEntityById(divisionId) == null) {
			throw new BusinessException("Division no encontrada");
        }
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
	public MatchResponseDTO saveMatch(MatchCreationDTO aMatchRequest) {
		Division aDivision = divisionService.findDivisionEntityById(aMatchRequest.divisionId());
		if (aDivision == null) {
			throw new BusinessException("No se puede asociar un partido a una division que no existe");
		}

		LocalDateTime startDate = aMatchRequest.date();
		LocalDateTime endDate = startDate.plusMinutes(MATCH_DURATION_MINUTES);
		LocalDateTime overlapStart = startDate.minusMinutes(MATCH_DURATION_MINUTES);

		if (matchRepository.findByDivisionIdAndTimeFrame(
				aDivision.getId(), overlapStart, endDate) != null) {
			throw new BusinessException("Ya existe un partido planeado en esa franja horaria");
		}

		Match aMatch = new Match();
		aMatch.setDate(aMatchRequest.date());
		aMatch.setDivision(aDivision);
		aMatch.setOpponent(aMatchRequest.opponent());
		aMatch.setStatus(MatchStatus.NOT_STARTED);

		aMatch = matchRepository.save(aMatch);
		return MatchDTOMapper.toResponseDTO(aMatch);
	}

	@Transactional
	public MatchResponseDTO updateMatch(UUID matchId, MatchUpdateDTO request) {
		Match match = findMatchEntityById(matchId);
		if (match == null) {
			throw new BusinessException("Partido no encontrado");
		}

		match.setDate(request.date());
		match.setOpponent(request.opponent());

		return MatchDTOMapper.toResponseDTO(matchRepository.save(match));
	}

	@Transactional 
	public MatchResponseDTO changeMatchStatus(UUID matchId, MatchStatus matchStatus) {
		Match aMatch = findMatchEntityById(matchId);
		if (aMatch == null) {
			throw new BusinessException("Partido no encontrado");
		}
		aMatch.setStatus(matchStatus);
		return MatchDTOMapper.toResponseDTO(matchRepository.save(aMatch));
	}
}
