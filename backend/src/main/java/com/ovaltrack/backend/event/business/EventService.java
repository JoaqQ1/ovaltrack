package com.ovaltrack.backend.event.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.event.repository.EventTypeRepository;

import jakarta.transaction.Transactional;

@Service
public class EventService {

	@Autowired
	private EventRepository eventRepository;

	@Autowired 
	private EventTypeRepository eventTypeRepository;

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * EVENT FUNCTIONS
     * /////////////////////////////////////////////////////////////////////////////
     */

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
		Event anEvent = findEventByIdAndMatchId(event.getId(), match.getId());
		if (anEvent != null) {
			//TODO: Update request logic for event, such as player inclusion in post-match analysis
		}
		if (eventRepository.findById(event.getId()) != null) {
			throw new BusinessException("No se puede asignar un evento de otro partido");
		}
		event.setMatch(match);
		return eventRepository.save(event);
	}

	@Transactional
	public void deleteEvent(UUID eventId, UUID matchId) {
		Event anEvent = findEventByIdAndMatchId(eventId, matchId);
		if (anEvent == null) {
			throw new BusinessException("No se puede eliminar un evento que no existe");
		}

		//anEvent.setActive(false);
		eventRepository.deleteById(eventId);
	}

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * EVENT_TYPE FUNCTIONS
     * /////////////////////////////////////////////////////////////////////////////
     */

	public Collection<EventType> findAllEventTypes() {
		return eventTypeRepository.findAll();
	}

	public EventType findEventTypeById(UUID eventTypeId) {
		return eventTypeRepository.findById(eventTypeId).orElse(null);
	}

	@Transactional 
	public EventType saveEventType(EventType anEventType) {
		return eventTypeRepository.save(anEventType);
	}

	@Transactional 
	public void deleteEventType(UUID anEventTypeId) {
		eventTypeRepository.deleteById(anEventTypeId);
	}

}
