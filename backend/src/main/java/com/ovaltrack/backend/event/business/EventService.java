package com.ovaltrack.backend.event.business;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.match.business.MatchSecurityValidator;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.dto.EventDTOMapper;
import com.ovaltrack.backend.event.domain.dto.event.EventCreationDTO;
import com.ovaltrack.backend.event.domain.dto.event.EventResponseDTO;
import com.ovaltrack.backend.event.domain.dto.event.EventUpdateDTO;
import com.ovaltrack.backend.event.domain.dto.event.MatchTimelineEventResponseDTO;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.match.repository.MatchRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventService {

	public static final int MAX_FIRST_HALF_MATCH_SECONDS = 2400; // 40 min reglamentarios
	public static final int MAX_SECOND_HALF_MATCH_SECONDS = 4800; // 80 min reglamentarios (40 + 40)

	private final EventRepository eventRepository;
	private final EventTypeService eventTypeService;
	private final ClubService clubService;
	private final MatchService matchService;
	private final PersonService personService;
	private final MatchRepository matchRepository;
	private final MatchSecurityValidator matchSecurityValidator;

	public Collection<EventResponseDTO> findEventsByClubId(UUID clubId) {
		if (clubService.findClubById(clubId) == null) {
			throw new BusinessException("Club no encontrado");
		}
		return eventRepository.findEventsByClubId(clubId).stream()
				.map(EventDTOMapper::toResponseDTO)
				.toList();
	}

	public Collection<EventResponseDTO> findEventsByDivisionId(UUID divisionId) {
		if (clubService.findClubById(divisionId) == null) {
			throw new BusinessException("Division no encontrada");
		}
		return eventRepository.findEventsByDivisionId(divisionId).stream()
				.map(EventDTOMapper::toResponseDTO)
				.toList();
	}

	public Collection<EventResponseDTO> findEventsByMatchId(UUID matchId) {
		if (matchService.findMatchById(matchId) == null) {
			throw new BusinessException("Partido no encontrado");
		}
		return eventRepository.findEventsByMatchId(matchId).stream()
				.map(EventDTOMapper::toResponseDTO)
				.toList();
	}

	public Collection<MatchTimelineEventResponseDTO> findPostMatchEvents(UUID matchId, Authentication authentication) {
		Match match = matchService.findMatchEntityById(matchId);
		if (match == null) {
			throw new BusinessException("Partido no encontrado");
		}
		matchSecurityValidator.validateCanManageMatch(match, authentication);
		if (match.getStatus() != MatchStatus.FINISHED) {
			throw new BusinessException("El partido aún no se encuentra cerrado");
		}
		return eventRepository.findPostMatchEventsByMatchId(matchId).stream()
				.map(EventDTOMapper::toTimelineResponseDTO)
				.toList();
	}

	public EventResponseDTO findEventById(UUID eventId) {
		Event result = eventRepository.findActiveEventById(eventId);
		return EventDTOMapper.toResponseDTO(result);
	}

	public Event findEventEntityById(UUID eventId) {
		return eventRepository.findActiveEventById(eventId);
	}

	@Transactional
	public EventResponseDTO saveEvent(EventCreationDTO eventRequest, Authentication authentication) {
		Event existingEvent = findExistingClientEvent(eventRequest.clientEventId(), eventRequest.matchId());
		if (existingEvent != null) {
			return EventDTOMapper.toResponseDTO(existingEvent);
		}

		EventType aEventType = eventTypeService.findEventTypeEntityById(eventRequest.eventTypeId());
		if (aEventType == null) {
			throw new BusinessException(
					"No se puede crear un nuevo evento a partir de un tipo de evento que no existe");
		}

		EventAttributeValidator.validate(aEventType, eventRequest.attributes());
		
		Match match = matchService.findMatchEntityById(eventRequest.matchId());
		if (match == null) {
			throw new BusinessException("No se puede asignar un evento a un partido que no existe");
		}
		if (match.getStatus() == MatchStatus.CANCELLED) {
			throw new BusinessException("No se puede asignar un evento a un partido cancelado");
		}

		if (match.getStatus() == MatchStatus.FINISHED && !Event.ORIGIN_POST_CAPTURE.equals(eventRequest.origin())) {
			throw new BusinessException("No se puede cargar eventos mediante esta pantalla para un partido que ya termino");
		}

		if (authentication != null) {
			matchSecurityValidator.validateCanManageMatch(match, authentication);
		}

		validateMatchTimePeriod(eventRequest.period(), eventRequest.matchTime());
		validatePlayerPossession(eventRequest.teamPossession(), eventRequest.playerId());

		Person aPerson = resolveEventPlayer(eventRequest.playerId(), match);

		Event result = EventDTOMapper.toEntity(eventRequest, match, aEventType, aPerson);

		Event savedEvent = eventRepository.save(result);
		recalculateMatchScore(match);
		return EventDTOMapper.toResponseDTO(savedEvent);
	}

	@Transactional
	public EventResponseDTO saveEvent(EventCreationDTO eventRequest) {
		return saveEvent(eventRequest, null);
	}

	private Event findExistingClientEvent(UUID clientEventId, UUID matchId) {
		if (clientEventId == null) {
			return null;
		}

		Event existingEvent = eventRepository.findByClientEventId(clientEventId);
		if (existingEvent != null && !existingEvent.getMatch().getId().equals(matchId)) {
			throw new BusinessException("El identificador del evento ya pertenece a otro partido");
		}

		return existingEvent;
	}

	private Person resolveEventPlayer(UUID playerId, Match match) {
		if (playerId == null) {
			return null;
		}

		Person player = personService.findPersonEntityById(playerId);
		if (player == null) {
			throw new BusinessException("No se puede asignar un evento a un jugador que no existe");
		}

		boolean playerInRoster = match.getRoster().stream()
				.anyMatch(matchPlayer -> matchPlayer.getDivisionPlayer().getPerson().getId().equals(playerId));
		if (!playerInRoster) {
			throw new BusinessException(
					"No se puede asignar un evento a un jugador que no pertenece al plantel del partido");
		}

		return player;
	}

	@Transactional
	public EventResponseDTO deleteEvent(UUID eventId, Authentication authentication) {
		Event result = eventRepository.findById(eventId).orElse(null);
		if (result == null) {
			throw new BusinessException("No se puede eliminar un evento que no existe");
		}

		if (authentication != null) {
			matchSecurityValidator.validateCanManageMatch(result.getMatch(), authentication);
		}

		if (!Boolean.TRUE.equals(result.getActive())) {
			return EventDTOMapper.toResponseDTO(result);
		}

		result.setActive(false);
		result.setSynchronizedAt(LocalDateTime.now());
		Event savedEvent = eventRepository.save(result);
		recalculateMatchScore(result.getMatch());
		return EventDTOMapper.toResponseDTO(savedEvent);
	}

	@Transactional
	public EventResponseDTO deleteEvent(UUID eventId) {
		return deleteEvent(eventId, null);
	}

	@Transactional
	public EventResponseDTO updateEvent(UUID eventId, EventUpdateDTO eventRequest, Authentication authentication) {
		Event result = findEventEntityById(eventId);
		if (result == null) {
			throw new BusinessException("No se puede modificar un evento que no existe");
		}

		if (authentication != null) {
			matchSecurityValidator.validateCanManageMatch(result.getMatch(), authentication);
		}

		Integer effectivePeriod = eventRequest.period() != null ? eventRequest.period() : result.getPeriod();
		Integer effectiveMatchTime = eventRequest.matchTime() != null ? eventRequest.matchTime()
				: result.getMatchTime();
		validateMatchTimePeriod(effectivePeriod, effectiveMatchTime);

		boolean eventTypeChanged = false;
		if (eventRequest.eventTypeId() != null) {
			EventType aEventType = eventTypeService.findEventTypeEntityById(eventRequest.eventTypeId());
			if (aEventType == null) {
				throw new BusinessException("No se puede asociar un evento a un tipo de evento que no existe");
			}
			if (result.getEventType() == null || !aEventType.getId().equals(result.getEventType().getId())) {
				eventTypeChanged = true;
			}
			result.setEventType(aEventType);
		}

		if (eventTypeChanged && eventRequest.attributes() == null) {
			result.setAttributes(null);
		}

		if (eventRequest.attributes() != null) {
			EventAttributeValidator.validate(result.getEventType(), eventRequest.attributes());
		}

		EventPossession effectivePossession = eventRequest.teamPossession() != null ? eventRequest.teamPossession()
				: result.getTeamPossession();
		UUID effectivePlayerId = eventRequest.playerId() != null ? eventRequest.playerId()
				: (eventRequest.teamPossession() == EventPossession.OPPONENT ? null
						: (result.getPlayer() != null ? result.getPlayer().getId() : null));

		validatePlayerPossession(effectivePossession, effectivePlayerId);

		if (effectivePossession == EventPossession.OPPONENT) {
			result.setPlayer(null);
		} else if (eventRequest.playerId() != null) {
			Person person = resolveEventPlayer(eventRequest.playerId(), result.getMatch());
			result.setPlayer(person);
		}

		if (eventRequest.teamPossession() != null) {
			result.setTeamPossession(eventRequest.teamPossession());
		}
		result.updateTimingAndOrigin(
				eventRequest.matchTime(),
				eventRequest.absoluteMatchTime(),
				eventRequest.period(),
				eventRequest.origin()
		);
		if (eventRequest.attributes() != null) {
			result.setAttributes(eventRequest.attributes());
		}
		result.setSynchronizedAt(LocalDateTime.now());

		Event savedEvent = eventRepository.save(result);
		recalculateMatchScore(result.getMatch());
		return EventDTOMapper.toResponseDTO(savedEvent);
	}

	@Transactional
	public EventResponseDTO updateEvent(UUID eventId, EventUpdateDTO eventRequest) {
		return updateEvent(eventId, eventRequest, null);
	}

	private void recalculateMatchScore(Match match) {
		if (match == null || match.getId() == null) {
			return;
		}

		int homeScore = 0;
		int awayScore = 0;

		for (Event event : eventRepository.findEventsByMatchId(match.getId())) {
			EventType eventType = event.getEventType();
			if (!EventRules.countsAsScoring(eventType, event.getAttributes())) {
				continue;
			}

			int points = eventType.getPoints() != null ? eventType.getPoints() : 0;
			if (event.getTeamPossession() == com.ovaltrack.backend.event.domain.EventPossession.OPPONENT) {
				awayScore += points;
			} else if (event.getTeamPossession() == com.ovaltrack.backend.event.domain.EventPossession.OWN
					|| event.getPlayer() != null) {
				homeScore += points;
			}
		}

		match.setHomeScore(homeScore);
		match.setAwayScore(awayScore);
		matchRepository.save(match);
	}

	private void validateMatchTimePeriod(Integer period, Integer matchTime) {
		if (matchTime != null) {
			if (matchTime < 0) {
				throw new BusinessException("El tiempo de juego no puede ser negativo");
			}
			if (Integer.valueOf(1).equals(period) && matchTime > MAX_FIRST_HALF_MATCH_SECONDS) {
				throw new BusinessException("El tiempo de juego del 1° Tiempo no puede exceder los 40 minutos");
			}
			if (Integer.valueOf(2).equals(period) && matchTime > MAX_SECOND_HALF_MATCH_SECONDS) {
				throw new BusinessException("El tiempo de juego del 2° Tiempo no puede exceder los 80 minutos");
			}
		}
	}

	private void validatePlayerPossession(EventPossession possession, UUID playerId) {
		if (possession == EventPossession.OPPONENT && playerId != null) {
			throw new BusinessException("No se puede asignar un jugador a un evento del equipo rival");
		}
	}

}
