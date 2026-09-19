package com.ovaltrack.backend.event.presenter;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.event.business.EventTypeService;
import com.ovaltrack.backend.event.domain.dto.EventTypeResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("eventType")
@Tag(name = "Event types", description = "Query event types available for match events")
public class EventTypePresenter {

    @Autowired
    private EventTypeService eventTypeService;

    @Operation(
        summary = "List all event types",
        description = "Returns every event type available in the system."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Event types returned successfully, even if there are none.")
    })
    @GetMapping
    public ResponseEntity<Object> findAllEventTypes() {
        return ResponseEntity.ok(eventTypeService.findAllEventTypes());
    }

    @Operation(
        summary = "Find an event type",
        description = "Returns the event type identified by the eventTypeId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Event type returned successfully."),
        @ApiResponse(responseCode = "404", description = "No event type exists with the specified ID.")
    })
    @GetMapping("/{eventTypeId}")
    public ResponseEntity<Object> findEventTypeById(@PathVariable UUID eventTypeId) {
        EventTypeResponseDTO result = eventTypeService.findEventTypeById(eventTypeId);
        return (result != null) ? ResponseEntity.ok(result)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Tipo de evento no encontrado");
    }

}

