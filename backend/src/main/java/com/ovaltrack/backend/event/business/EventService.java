package com.ovaltrack.backend.event.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.repository.EventRepository;

import jakarta.transaction.Transactional;

@Service
public class EventService {

	@Autowired
	private EventRepository eventRepository;

	public Collection<Event> findEventsByClubId(UUID clubId) {
		return eventRepository.findEventsByClubId(clubId);
	}

	public Collection<Event> findEventsByDivisionId(UUID divisionId) {
		return eventRepository.findEventsByDivisionId(divisionId);
	}

	public Collection<Event> findEventsByMatchId(UUID matchId) {
		return eventRepository.findEventsByMatchId(matchId);
	}

	public Event findEventByIdAndMatchId(UUID eventId, UUID matchId) {
		return eventRepository.findEventByIdAndMatchId(eventId, matchId);
	}

	@Transactional
	public Event saveEvent(Match match, Event event) {
		event.setMatch(match);
		return eventRepository.save(event);
	}

	@Transactional
	public void deleteEvent(UUID eventId, UUID matchId) {
		if (findEventByIdAndMatchId(eventId, matchId) == null) {
			throw new BusinessException("No se puede eliminar un evento que no existe");
		}
		eventRepository.deleteById(eventId);
	}
}
