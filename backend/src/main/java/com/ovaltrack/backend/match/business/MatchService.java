package com.ovaltrack.backend.match.business;

import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;
import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.event.domain.dto.EventDTOMapper;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.event.repository.EventTypeRepository;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.match.domain.dto.MatchCreationDTO;
import com.ovaltrack.backend.match.domain.dto.MatchDTOMapper;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;
import com.ovaltrack.backend.match.domain.dto.MatchUpdateDTO;
import com.ovaltrack.backend.match.domain.dto.RosterDTO;
import com.ovaltrack.backend.match.domain.dto.LiveMatchStateDTO;
import com.ovaltrack.backend.match.domain.dto.LiveMatchBootstrapDTO;
import com.ovaltrack.backend.match.domain.dto.MatchRosterPlayerDTO;
import com.ovaltrack.backend.match.repository.MatchPlayerRepository;
import com.ovaltrack.backend.match.repository.MatchRepository;
import java.util.Comparator;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.match.domain.event.MatchPeriodClosedEvent;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final Logger logger = LoggerFactory.getLogger(MatchService.class);

    private static final int MATCH_DURATION_MINUTES = 90;

    @Autowired
    private DivisionPlayerRepository divisionPlayerRepository;

    @Autowired
    private DivisionService divisionService;

    @Autowired
    private MatchPlayerRepository matchPlayerRepository;

    private final MatchRepository matchRepository;
    private final EventRepository eventRepository;
    private final EventTypeRepository eventTypeRepository;
    private final MatchSecurityValidator matchSecurityValidator;
    private final ApplicationEventPublisher eventPublisher;

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
        return matchRepository.findAllMatchesByDivisionId(divisionId).stream().map(MatchDTOMapper::toResponseDTO)
                .toList();
    }

    public MatchResponseDTO findMatchById(UUID matchId) {
        Match result = matchRepository.findById(matchId).orElse(null);
        return MatchDTOMapper.toResponseDTO(result);
    }

    @Transactional(readOnly = true)
    public MatchResponseDTO getLiveMatchState(UUID matchId) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        return MatchDTOMapper.toResponseDTO(match);
    }

    @Transactional(readOnly = true)
    public LiveMatchBootstrapDTO getLiveMatchBootstrap(UUID matchId) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        return new LiveMatchBootstrapDTO(
                MatchDTOMapper.toResponseDTO(match),
                eventRepository.findEventsByMatchId(matchId).stream()
                        .map(EventDTOMapper::toResponseDTO)
                        .toList(),
                eventTypeRepository.findByIsActiveTrue().stream()
                        .map(EventDTOMapper::toResponseDTO)
                        .toList());
    }

    @Transactional
    public MatchResponseDTO updateLiveMatchState(UUID matchId, LiveMatchStateDTO request) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        match.setClockElapsedSeconds(request.clockElapsedSeconds());
        match.setClockPaused(request.clockPaused());
        match.setCurrentPossession(request.currentPossession());
        match.setClockUpdatedAt(LocalDateTime.now());

        return MatchDTOMapper.toResponseDTO(matchRepository.save(match));
    }

    public Match findMatchEntityById(UUID matchId) {
        return matchRepository.findById(matchId).orElse(null);
    }

    @Transactional
    public MatchResponseDTO saveMatch(MatchCreationDTO request) {
        Division division = divisionService.findDivisionEntityById(request.divisionId());
        if (division == null) {
            throw new BusinessException("No se puede asociar un partido a una division que no existe");
        }

        LocalDateTime startDate = request.date();
        LocalDateTime endDate = startDate.plusMinutes(MATCH_DURATION_MINUTES);
        LocalDateTime overlapStart = startDate.minusMinutes(MATCH_DURATION_MINUTES);

        if (matchRepository.findByDivisionIdAndTimeFrame(
                division.getId(), overlapStart, endDate) != null) {
            throw new BusinessException("Ya existe un partido planeado en esa franja horaria");
        }

        Match match = new Match();
        match.setDate(request.date());
        match.setDivision(division);
        match.setOpponent(request.opponent());
        match.setStatus(MatchStatus.EMPTY_ROSTER);

        match = matchRepository.save(match);
        return MatchDTOMapper.toResponseDTO(match);
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
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new BusinessException("Partido no encontrado");
        }

        validateStatusChange(match, matchStatus);
        applyStatusChange(match, matchStatus);

        return MatchDTOMapper.toResponseDTO(matchRepository.save(match));
    }

    private void validateStatusChange(Match match, MatchStatus targetStatus) {
        MatchStatus currentStatus = match.getStatus();

        if (currentStatus == targetStatus) {
            throw new BusinessException("No se puede asignar el mismo estado al partido");
        }

        if (targetStatus == MatchStatus.IN_PROGRESS
                && (currentStatus == MatchStatus.EMPTY_ROSTER || currentStatus == MatchStatus.NOT_STARTED)) {
            validateRosterForStart(match);
        }

        if (currentStatus == MatchStatus.EMPTY_ROSTER && targetStatus == MatchStatus.FINISHED) {
            throw new BusinessException("No se puede finalizar un partido que no fue empezado");
        }

        if (currentStatus == MatchStatus.FINISHED && targetStatus == MatchStatus.CANCELLED) {
            throw new BusinessException("No se puede cancelar un partido que ya termino");
        }
    }

    private void validateRosterForStart(Match match) {
        boolean hasTitular = getSavedRoster(match.getId()).getStartingPlayers().size() >= 1;
        if (!hasTitular) {
            throw new BusinessException(
                    "No se puede iniciar el partido sin al menos un jugador titular registrado.");
        }
    }

    private void applyStatusChange(Match match, MatchStatus targetStatus) {
        match.setStatus(targetStatus);
        if (targetStatus == MatchStatus.IN_PROGRESS && match.getStartedAt() == null) {
            match.setStartedAt(LocalDateTime.now());
        }
        if (targetStatus == MatchStatus.FINISHED) {
            match.setFinishedAt(LocalDateTime.now());
        }
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
        match.setStatus(MatchStatus.NOT_STARTED);
        matchRepository.save(match);

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

    @Transactional(readOnly = true)
    public List<MatchRosterPlayerDTO> getMatchRosterPlayers(UUID matchId) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        if (match.getRoster() == null || match.getRoster().isEmpty()) {
            return List.of();
        }

        return match.getRoster().stream()
                .map(this::toMatchRosterPlayerDTO)
                .sorted(Comparator.comparing((MatchRosterPlayerDTO p) -> p.getRole() == MatchPlayerRole.TITULAR ? 0 : 1)
                        .thenComparing(p -> p.getFullName(), String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private MatchRosterPlayerDTO toMatchRosterPlayerDTO(MatchPlayer mp) {
        DivisionPlayer dp = mp.getDivisionPlayer();
        var person = dp.getPerson();
        String fullName = ((person.getFirstName() != null ? person.getFirstName() : "") + " "
                + (person.getLastName() != null ? person.getLastName() : "")).trim();

        return MatchRosterPlayerDTO.builder()
                .id(person.getId())
                .fullName(fullName.isEmpty() ? "Sin Nombre" : fullName)
                .role(mp.getRole())
                .position(dp.getPosition())
                .build();
    }

    @Transactional
    public MatchResponseDTO closeFirstHalf(UUID matchId, Authentication authentication) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        matchSecurityValidator.validateCanManageMatch(match, authentication);

        match.closeFirstHalf();
        Match updatedMatch = matchRepository.save(match);

        eventPublisher.publishEvent(new MatchPeriodClosedEvent(updatedMatch.getId(), 1, LocalDateTime.now()));

        return MatchDTOMapper.toResponseDTO(updatedMatch);
    }

    @Transactional
    public MatchResponseDTO startSecondHalf(UUID matchId, Authentication authentication) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        matchSecurityValidator.validateCanManageMatch(match, authentication);

        match.startSecondHalf();
        Match updatedMatch = matchRepository.save(match);

        return MatchDTOMapper.toResponseDTO(updatedMatch);
    }
}
