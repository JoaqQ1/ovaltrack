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
	public EventResponseDTO saveEvent(EventCreationDTO eventRequest) {
		Event existingEvent = findExistingClientEvent(eventRequest.clientEventId(), eventRequest.matchId());
		if (existingEvent != null) {
			return EventDTOMapper.toResponseDTO(existingEvent);
		}

		EventType aEventType = eventTypeService.findEventTypeEntityById(eventRequest.eventTypeId());
		if (aEventType == null) {
			throw new BusinessException("No se puede crear un nuevo evento a partir de un tipo de evento que no existe");
		}

		Match aMatch = matchService.findMatchEntityById(eventRequest.matchId());
		if (aMatch == null) {
			throw new BusinessException("No se puede asignar un evento a un partido que no existe");
		}
		if (aMatch.getStatus() == com.ovaltrack.backend.match.domain.MatchStatus.CANCELLED) {
			throw new BusinessException("No se puede asignar un evento a un partido cancelado");
		}
		if (aMatch.getStatus() == MatchStatus.FINISHED && !Event.ORIGIN_POST_CAPTURE.equals(eventRequest.origin())) {
			throw new BusinessException("No se puede cargar eventos mediante esta pantalla para un partido que ya termino");
		}

		Person aPerson = resolveEventPlayer(eventRequest.playerId(), aMatch);

		Event result = new Event();
		result.setClientEventId(eventRequest.clientEventId());
		result.setEventType(aEventType);
		result.setMatch(aMatch);
		result.setPlayer(aPerson);
		result.setTeamPossession(eventRequest.teamPossession());
		result.setMatchTime(eventRequest.matchTime());
		result.setAbsoluteMatchTime(eventRequest.absoluteMatchTime());
		result.setRealTime(eventRequest.realTime());
		result.setPeriod(eventRequest.period());
		result.setOrigin(eventRequest.origin());
		result.setAttributes(eventRequest.attributes());
		result.setSynchronizedAt(LocalDateTime.now());
		result.setActive(true);

		Event savedEvent = eventRepository.save(result);
		recalculateMatchScore(aMatch);
		return EventDTOMapper.toResponseDTO(savedEvent);
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
			throw new BusinessException("No se puede asignar un evento a un jugador que no pertenece al plantel del partido");
		}

		return player;
	}

	@Transactional
	public EventResponseDTO deleteEvent(UUID eventId) {
		Event result = eventRepository.findById(eventId).orElse(null);
		if (result == null) {
			throw new BusinessException("No se puede eliminar un evento que no existe");
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
	public EventResponseDTO updateEvent(UUID eventId, EventUpdateDTO eventRequest) {
		Event result = findEventEntityById(eventId);
		if (result == null) {
			throw new BusinessException("No se puede modificar un evento que no existe");
		}

		if (eventRequest.eventTypeId() != null) {
			EventType aEventType = eventTypeService.findEventTypeEntityById(eventRequest.eventTypeId());
			if (aEventType == null) {
				throw new BusinessException("No se puede asociar un evento a un tipo de evento que no existe");
			}
			result.setEventType(aEventType);
		}

		Person aPerson = resolveEventPlayer(eventRequest.playerId(), result.getMatch());
		result.setPlayer(aPerson);

		if (eventRequest.teamPossession() != null) {
			result.setTeamPossession(eventRequest.teamPossession());
		}
		if (eventRequest.matchTime() != null) {
			result.setMatchTime(eventRequest.matchTime());
		}
		if (eventRequest.absoluteMatchTime() != null) {
			result.setAbsoluteMatchTime(eventRequest.absoluteMatchTime());
		}
		if (eventRequest.period() != null) {
			result.setPeriod(eventRequest.period());
		}
		if (eventRequest.origin() != null) {
			result.setOrigin(eventRequest.origin());
		}
		if (eventRequest.attributes() != null) {
			result.setAttributes(eventRequest.attributes());
		}
		result.setSynchronizedAt(LocalDateTime.now());

		Event savedEvent = eventRepository.save(result);
		recalculateMatchScore(result.getMatch());
		return EventDTOMapper.toResponseDTO(savedEvent);
	}

	private void recalculateMatchScore(Match match) {
		int homeScore = 0;
		int awayScore = 0;

		for (Event event : eventRepository.findEventsByMatchId(match.getId())) {
			EventType eventType = event.getEventType();
			if (!Boolean.TRUE.equals(eventType.getIsScoring())) {
				continue;
			}

			int points = eventType.getPoints() != null ? eventType.getPoints() : 0;
			if (event.getTeamPossession() == com.ovaltrack.backend.event.domain.EventPossession.OPPONENT) {
				awayScore += points;
			} else {
				homeScore += points;
			}
		}

		match.setHomeScore(homeScore);
		match.setAwayScore(awayScore);
		matchRepository.save(match);
	}

}
