package com.ovaltrack.backend.event.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.event.business.EventService;
import com.ovaltrack.backend.event.domain.Event;

@RestController
@RequestMapping("event")
public class EventController {

	@Autowired
	private EventService eventService;

	@GetMapping
	public ResponseEntity<Collection<Event>> findAllEvents() {
		return ResponseEntity.ok(eventService.findAllEvents());
	}

	@PostMapping
	public ResponseEntity<Event> saveEvent(@RequestBody Event event) {
		return ResponseEntity.ok(eventService.saveEvent(event));
	}

	@DeleteMapping("/{eventId}")
	public ResponseEntity<Void> deleteEvent(@PathVariable UUID eventId) {
		eventService.deleteEvent(eventId);
		return ResponseEntity.noContent().build();
	}
}
