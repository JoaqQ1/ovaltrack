package com.ovaltrack.backend.match.business;

import java.util.List;
import java.util.ArrayList;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
import com.ovaltrack.backend.match.domain.Opponent;
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
import com.ovaltrack.backend.match.repository.OpponentRepository;
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
    /** Los slots 1-15 son titulares; del 16 en adelante, suplentes. */
    private static final int STARTER_SLOTS = 15;

    @Autowired
    private DivisionPlayerRepository divisionPlayerRepository;

    @Autowired
    private DivisionService divisionService;

    @Autowired
    private MatchPlayerRepository matchPlayerRepository;

    private final MatchRepository matchRepository;
    private final EventRepository eventRepository;
    private final EventTypeRepository eventTypeRepository;
    private final OpponentRepository opponentRepository;
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

        Opponent opponent = opponentRepository.findById(request.opponentId())
                .orElseThrow(() -> new EntityNotFoundException("Oponente no encontrado"));

        Match match = new Match();
        match.setDate(request.date());
        match.setDivision(division);
        match.setOpponent(opponent);
        match.setStatus(MatchStatus.NOT_STARTED);

        match = matchRepository.save(match);
        return MatchDTOMapper.toResponseDTO(match);
    }

    @Transactional
    public MatchResponseDTO updateMatch(UUID matchId, MatchUpdateDTO request) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        Opponent opponent = opponentRepository.findById(request.opponentId())
                .orElseThrow(() -> new EntityNotFoundException("Oponente no encontrado"));

        match.setDate(request.date());
        match.setOpponent(opponent);

        return MatchDTOMapper.toResponseDTO(matchRepository.save(match));
    }

    @Transactional
    public MatchResponseDTO changeMatchStatus(UUID matchId, MatchStatus matchStatus) {
        return changeMatchStatus(matchId, matchStatus, null);
    }

    /**
     * @param occurredAt momento real de la transición informado por el cliente; si es null se usa
     *                   la hora del servidor.
     */
    @Transactional
    public MatchResponseDTO changeMatchStatus(UUID matchId, MatchStatus matchStatus, Instant occurredAt) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        validateStatusChange(match, matchStatus);
        applyStatusChange(match, matchStatus, resolveTransitionTime(occurredAt));

        return MatchDTOMapper.toResponseDTO(matchRepository.save(match));
    }

    private void validateStatusChange(Match match, MatchStatus targetStatus) {
        MatchStatus currentStatus = match.getStatus();

        if (currentStatus == targetStatus) {
            throw new BusinessException("No se puede asignar el mismo estado al partido");
        }

        if (currentStatus == MatchStatus.CANCELLED) {
            throw new BusinessException("No se puede modificar un partido cancelado");
        }

        if (currentStatus == MatchStatus.FINISHED && targetStatus == MatchStatus.IN_PROGRESS) {
            throw new BusinessException("No se puede reabrir un partido que ya termino");
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

    private void applyStatusChange(Match match, MatchStatus targetStatus, LocalDateTime transitionTime) {
        match.setStatus(targetStatus);
        if (targetStatus == MatchStatus.IN_PROGRESS && match.getStartedAt() == null) {
            match.setStartedAt(transitionTime);
        }
        if (targetStatus == MatchStatus.FINISHED) {
            LocalDateTime startedAt = match.getStartedAt();
            match.setFinishedAt(startedAt != null && transitionTime.isBefore(startedAt) ? startedAt : transitionTime);
        }
    }

    private LocalDateTime resolveTransitionTime(Instant occurredAt) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (occurredAt == null) {
            return now;
        }
        LocalDateTime clientTime = LocalDateTime.ofInstant(occurredAt, ZoneOffset.UTC);
        return clientTime.isAfter(now) ? now : clientTime;
    }

    @Transactional
    public void saveMatchRoster(UUID matchId, List<UUID> titularesIds, List<UUID> suplentesIds) {
        Match match = findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }
        if (match.getStatus() == MatchStatus.CANCELLED) {
            throw new BusinessException("No se puede modificar el plantel de un partido cancelado");
        }
        matchPlayerRepository.deleteByMatch(match);

        Map<UUID, DivisionPlayer> divisionPlayersByPersonId = new HashMap<>();
        for (DivisionPlayer dp : divisionPlayerRepository.findByDivisionId(match.getDivision().getId())) {
            divisionPlayersByPersonId.putIfAbsent(dp.getPerson().getId(), dp);
        }

        List<MatchPlayer> nuevosJugadores = new ArrayList<>();
        Set<UUID> assignedPersonIds = new HashSet<>();
        addRosterPlayers(match, titularesIds, MatchPlayerRole.TITULAR, divisionPlayersByPersonId, assignedPersonIds, nuevosJugadores);
        addRosterPlayers(match, suplentesIds, MatchPlayerRole.SUPLENTE, divisionPlayersByPersonId, assignedPersonIds, nuevosJugadores);

        if (match.getStatus() == null || match.getStatus() == MatchStatus.EMPTY_ROSTER) {
            match.setStatus(MatchStatus.NOT_STARTED);
        }
        matchRepository.save(match);

        matchPlayerRepository.saveAll(nuevosJugadores);
    }

    private void addRosterPlayers(
            Match match,
            List<UUID> personIds,
            MatchPlayerRole role,
            Map<UUID, DivisionPlayer> divisionPlayersByPersonId,
            Set<UUID> assignedPersonIds,
            List<MatchPlayer> roster) {
        int slotOrder = 0;
        for (UUID personId : Objects.requireNonNullElse(personIds, List.<UUID>of())) {
            DivisionPlayer divisionPlayer = divisionPlayersByPersonId.get(personId);
            if (divisionPlayer == null || !assignedPersonIds.add(personId)) {
                continue;
            }
            roster.add(MatchPlayer.builder()
                    .match(match)
                    .divisionPlayer(divisionPlayer)
                    .role(role)
                    .slotOrder(slotOrder++)
                    .build());
        }
    }

    /**
     * Valida un cambio contra el plantel del partido. El plantel guardado es la formación inicial y
     * no se modifica: quién está en cancha se deriva de los eventos SUBSTITUTION en orden, así un
     * cambio cargado offline o borrado después no deja el plantel desfasado.
     */
    public void validateSubstitution(Match match, Map<String, Object> attributes) {
        if (match == null || attributes == null) {
            throw new BusinessException("El cambio requiere jugadores de entrada y salida");
        }

        MatchPlayer outgoing = findRosterPlayer(match, attributes, "playerOutId", "playerOutNumber");
        MatchPlayer incoming = findRosterPlayer(match, attributes, "playerInId", "playerInNumber");

        if (outgoing == null || incoming == null) {
            throw new BusinessException("Los jugadores indicados no pertenecen al plantel del partido");
        }
        if (outgoing == incoming) {
            throw new BusinessException("El jugador que sale y el que entra deben ser distintos");
        }
    }

    /** Busca por id de persona y, si falta, por número de slot (titulares 1-15, suplentes 16-23). */
    private MatchPlayer findRosterPlayer(Match match, Map<String, Object> attributes,
            String idKey, String slotKey) {
        Object rawId = attributes.get(idKey);
        if (rawId instanceof String id) {
            try {
                UUID personId = UUID.fromString(id);
                MatchPlayer byId = match.getRoster().stream()
                        .filter(player -> player.getDivisionPlayer().getPerson().getId().equals(personId))
                        .findFirst()
                        .orElse(null);
                if (byId != null) {
                    return byId;
                }
            } catch (IllegalArgumentException ignored) {
                // Eventos sin id válido: se resuelve por número de slot.
            }
        }

        int slot = readSlotNumber(attributes, slotKey);
        MatchPlayerRole role = slot <= STARTER_SLOTS ? MatchPlayerRole.TITULAR : MatchPlayerRole.SUPLENTE;
        int slotOrder = role == MatchPlayerRole.TITULAR ? slot - 1 : slot - STARTER_SLOTS - 1;
        return match.getRoster().stream()
                .filter(player -> player.getRole() == role && Integer.valueOf(slotOrder).equals(player.getSlotOrder()))
                .findFirst()
                .orElse(null);
    }

    private int readSlotNumber(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        if (!(value instanceof Number number) || number.intValue() != number.doubleValue()) {
            throw new BusinessException("El campo " + key + " debe ser un número entero");
        }
        return number.intValue();
    }

    @Transactional(readOnly = true)
    public RosterDTO getSavedRoster(UUID matchId) {
        Match match = matchRepository.findById(matchId).orElse(null);

        if (match == null || match.getRoster() == null || match.getRoster().isEmpty()) {
            return new RosterDTO(List.of(), List.of());
        }

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
