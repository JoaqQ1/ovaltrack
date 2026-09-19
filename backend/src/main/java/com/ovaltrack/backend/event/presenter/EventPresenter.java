package com.ovaltrack.backend.event.presenter;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.event.business.EventService;
import com.ovaltrack.backend.event.domain.dto.event.EventCreationDTO;
import com.ovaltrack.backend.event.domain.dto.event.EventResponseDTO;
import com.ovaltrack.backend.event.domain.dto.event.EventUpdateDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("event")
public class EventPresenter {

    @Autowired
    private EventService eventService;

    @GetMapping("/club")
    public ResponseEntity<Object> findEventsByClubId(@RequestParam UUID clubId) {
        return ResponseEntity.ok(eventService.findEventsByClubId(clubId));
    }

    @GetMapping("/division")
    public ResponseEntity<Object> findEventsByDivisionId(@RequestParam UUID divisionId) {
        return ResponseEntity.ok(eventService.findEventsByDivisionId(divisionId));
    }

    @GetMapping("/match")
    public ResponseEntity<Object> findEventsByMatchId(@RequestParam UUID matchId) {
        return ResponseEntity.ok(eventService.findEventsByMatchId(matchId));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<Object> findEventById(@PathVariable UUID eventId) {
        EventResponseDTO result = eventService.findEventById(eventId);
        return (result != null) ? ResponseEntity.ok(result) 
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento no encontrado");
    }

    @PostMapping
    public ResponseEntity<Object> saveEvent(@Valid @RequestBody EventCreationDTO eventRequest, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(eventService.saveEvent(eventRequest));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Object> deleteEvent(@PathVariable UUID eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.ok("Evento eliminado correctamente");
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<Object> updateDivision(@PathVariable UUID eventId, @Valid @RequestBody EventUpdateDTO request,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(eventService.updateEvent(eventId, request));
    }

}

