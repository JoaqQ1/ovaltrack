package com.ovaltrack.backend.event.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
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

	public EventResponseDTO findEventById(UUID eventId) {
		Event result = eventRepository.findById(eventId).orElse(null);
		return EventDTOMapper.toResponseDTO(result);
	}

	public Event findEventEntityById(UUID eventId) {
		return eventRepository.findById(eventId).orElse(null);
	}

	@Transactional
	public EventResponseDTO saveEvent(EventCreationDTO eventRequest) {
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
		Person aPerson = resolveEventPlayer(eventRequest.playerId(), aMatch);

		Event result = new Event();
		result.setEventType(aEventType);
		result.setMatch(aMatch);
		result.setPlayer(aPerson);
		result.setTeamPossession(eventRequest.teamPossession());
		result.setMatchTime(eventRequest.matchTime());
		result.setRealTime(eventRequest.realTime());
		result.setPeriod(eventRequest.period());
		result.setOrigin(eventRequest.origin());
		result.setAttributes(eventRequest.attributes());
		result.setSynchronizedAt(eventRequest.synchronizedAt());
		result.setActive(true);

		Event savedEvent = eventRepository.save(result);
		recalculateMatchScore(aMatch);
		return EventDTOMapper.toResponseDTO(savedEvent);
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
		Event result = findEventEntityById(eventId);
		if (result == null) {
			throw new BusinessException("No se puede eliminar un evento que no existe");
		}

		result.setActive(false);
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

		result.setTeamPossession(eventRequest.teamPossession());
		result.setMatchTime(eventRequest.matchTime());
		result.setPeriod(eventRequest.period());
		result.setOrigin(eventRequest.origin());
		result.setAttributes(eventRequest.attributes());
		result.setSynchronizedAt(eventRequest.synchronizedAt());

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
