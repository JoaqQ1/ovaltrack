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
	public ResponseEntity<Object> findAllEvents() {
		return ResponseEntity.ok(eventService.findAllEvents());
	}

	@GetMapping("/{eventId}")
	public ResponseEntity<Object> findEventById(@PathVariable UUID eventId) {
		return ResponseEntity.ok(eventService.findEventById(eventId));
	}

	@PostMapping
	public ResponseEntity<Object> saveEvent(@RequestBody Event event) {
		return ResponseEntity.ok(eventService.saveEvent(event));
	}

	//TODO: Soft delete, change it
	@DeleteMapping("/{eventId}")
	public ResponseEntity<Object> deleteEvent(@PathVariable UUID eventId) {
		eventService.deleteEvent(eventId);
		return ResponseEntity.ok("Evento eliminado correctamente");
	}
}
