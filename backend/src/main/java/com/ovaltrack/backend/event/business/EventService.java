package com.ovaltrack.backend.event.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.repository.EventRepository;

import jakarta.transaction.Transactional;

@Service
public class EventService {

	@Autowired
	private EventRepository eventRepository;

	public Collection<Event> findAllEvents() {
		return eventRepository.findAll();
	}

	@Transactional
	public Event saveEvent(Event event) {
		return eventRepository.save(event);
	}

	@Transactional
	public void deleteEvent(UUID eventId) {
		eventRepository.deleteById(eventId);
	}
}
