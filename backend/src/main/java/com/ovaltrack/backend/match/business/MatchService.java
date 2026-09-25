package com.ovaltrack.backend.match.business;

import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;
import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.match.domain.dto.MatchCreationDTO;
import com.ovaltrack.backend.match.domain.dto.MatchDTOMapper;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;
import com.ovaltrack.backend.match.domain.dto.MatchUpdateDTO;
import com.ovaltrack.backend.match.domain.dto.RosterDTO;
import com.ovaltrack.backend.match.repository.MatchPlayerRepository;
import com.ovaltrack.backend.match.repository.MatchRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor 
public class MatchService {

	private static final int MATCH_DURATION_MINUTES = 90;

	@Autowired 
	private DivisionPlayerRepository divisionPlayerRepository;

	@Autowired 
	private DivisionService divisionService;

	@Autowired
    private MatchPlayerRepository matchPlayerRepository;

	private final MatchRepository matchRepository;

	//TODO: Exceptions for non-existent club and non-existent division
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
    public Match startMatch(UUID matchId) {
        Match aMatch = findMatchEntityById(matchId);
        if (aMatch == null) {
            throw new BusinessException("Partido no encontrado");
        }

        boolean hasTitular = aMatch.getRoster().stream()
                .anyMatch(player -> player.getRole() == MatchPlayerRole.TITULAR);

        if (!hasTitular) {
            throw new BusinessException("No se puede iniciar el partido sin al menos un jugador titular registrado.");
        }

        aMatch.setStatus(MatchStatus.IN_PROGRESS);
        return matchRepository.save(aMatch);
    }

	@Transactional
    public Match FinishMatch(UUID matchId) {
        Match aMatch = findMatchEntityById(matchId);
        if (aMatch == null) {
            throw new BusinessException("Partido no encontrado");
        }
        aMatch.setStatus(MatchStatus.FINISHED);
        return matchRepository.save(aMatch);
    }

	@Transactional
    public void deleteMatch(UUID matchId) {
        if (findMatchEntityById(matchId) == null) {
            throw new BusinessException("Partido no encontrado");
        }
        matchRepository.deleteById(matchId);
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

    public Match findMatchByIdAndDivisionId(UUID matchId, UUID divisionId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'findMatchByIdAndDivisionId'");
    }

	@Transactional
    public void saveMatchRoster(UUID matchId, List<UUID> titularesIds, List<UUID> suplentesIds) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new BusinessException("Partido no encontrado");
        }
        if (match.getStatus() == MatchStatus.CANCELLED) {
            throw new BusinessException("No se puede modificar el plantel de un partido cancelado");
        }
        matchPlayerRepository.deleteByMatch(match);
        List<MatchPlayer> nuevosJugadores = new ArrayList<>();

        List<DivisionPlayer> todosLosJugadores = divisionPlayerRepository.findAll();

        for (DivisionPlayer dp : todosLosJugadores) {
            UUID personId = dp.getPerson().getId();
            
            if (titularesIds.contains(personId)) {
                nuevosJugadores.add(MatchPlayer.builder()
                        .match(match)
                        .divisionPlayer(dp)
                        .role(MatchPlayerRole.TITULAR)
                        .build());
            } else if (suplentesIds.contains(personId)) {
                nuevosJugadores.add(MatchPlayer.builder()
                        .match(match)
                        .divisionPlayer(dp)
                        .role(MatchPlayerRole.SUPLENTE)
                        .build());
            }
        }
        
        // 4. Forzamos los INSERTS en la base de datos
        matchPlayerRepository.saveAll(nuevosJugadores);
    }

    @Transactional(readOnly = true)
    public RosterDTO getSavedRoster(UUID matchId) {
        Match match = matchRepository.findById(matchId).orElse(null);

        if (match == null || match.getRoster() == null || match.getRoster().isEmpty()) {
            return new RosterDTO(List.of(), List.of()); 
        }

        // 👉 VOLVEMOS AL ORIGINAL: Devolvemos la Persona para que Angular la reconozca
        List<UUID> startingPlayers = match.getRoster().stream()
                .filter(mp -> mp.getRole() == MatchPlayerRole.TITULAR) 
                .map(mp -> mp.getDivisionPlayer().getPerson().getId()) 
                .toList();

        List<UUID> substitutePlayers = match.getRoster().stream()
                .filter(mp -> mp.getRole() == MatchPlayerRole.SUPLENTE)
                .map(mp -> mp.getDivisionPlayer().getPerson().getId()) 
                .toList();

        return new RosterDTO(startingPlayers, substitutePlayers);
    }
}


