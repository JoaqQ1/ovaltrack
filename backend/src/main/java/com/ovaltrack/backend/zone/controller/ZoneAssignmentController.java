package com.ovaltrack.backend.zone.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.zone.business.ZoneAssignmentService;
import com.ovaltrack.backend.zone.domain.dto.MatchZonesResponseDTO;
import com.ovaltrack.backend.zone.domain.dto.ZoneAssignmentCreationDTO;
import com.ovaltrack.backend.zone.domain.dto.ZoneAssignmentResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("matches/{matchId}/zones")
@Tag(name = "Match zones", description = "Assign pitch zones to time ranges of a match")
@PreAuthorize("hasAnyRole('ADMIN_OVALTRACK', 'ADMIN_CLUB', 'COACH_ANALYST')")
@RequiredArgsConstructor
public class ZoneAssignmentController {

    private final ZoneAssignmentService zoneAssignmentService;

    @Operation(
        summary = "List the zones of a match",
        description = "Returns the zone assignments of the match and the number of events per pitch cell."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Zones returned successfully, even if there are none."),
        @ApiResponse(responseCode = "403", description = "Forbidden: user cannot manage this match."),
        @ApiResponse(responseCode = "404", description = "Match not found.")
    })
    @GetMapping
    public ResponseEntity<MatchZonesResponseDTO> findZones(@PathVariable UUID matchId, Authentication authentication) {
        return ResponseEntity.ok(zoneAssignmentService.findByMatch(matchId, authentication));
    }

    @Operation(
        summary = "Assign a zone to a time range",
        description = "Creates a zone assignment for a finished match. Ranges of the same period cannot overlap."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Zone assigned successfully."),
        @ApiResponse(responseCode = "400", description = "Missing fields or malformed body."),
        @ApiResponse(responseCode = "403", description = "Forbidden: user cannot manage this match."),
        @ApiResponse(responseCode = "404", description = "Match not found."),
        @ApiResponse(responseCode = "409", description = "Match not finished, invalid range or cell, or overlapping zone.")
    })
    @PostMapping
    public ResponseEntity<ZoneAssignmentResponseDTO> createZone(
            @PathVariable UUID matchId,
            @Valid @RequestBody ZoneAssignmentCreationDTO request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zoneAssignmentService.create(matchId, request, authentication));
    }

    @Operation(summary = "Modify a zone assignment", description = "Updates the cell and/or time range of an existing zone assignment.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Zone updated successfully."),
        @ApiResponse(responseCode = "400", description = "Missing fields or malformed body."),
        @ApiResponse(responseCode = "403", description = "Forbidden: user cannot manage this match."),
        @ApiResponse(responseCode = "404", description = "Match or zone not found."),
        @ApiResponse(responseCode = "409", description = "Match not finished, invalid range or cell, or overlapping zone.")
    })
    @PutMapping("/{zoneId}")
    public ResponseEntity<ZoneAssignmentResponseDTO> updateZone(
            @PathVariable UUID matchId,
            @PathVariable UUID zoneId,
            @Valid @RequestBody ZoneAssignmentCreationDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(zoneAssignmentService.update(matchId, zoneId, request, authentication));
    }

    @Operation(summary = "Delete a zone assignment", description = "Removes the zone assignment; its events become 'without zone'.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Zone deleted successfully."),
        @ApiResponse(responseCode = "403", description = "Forbidden: user cannot manage this match."),
        @ApiResponse(responseCode = "404", description = "Match or zone not found."),
        @ApiResponse(responseCode = "409", description = "Match not finished.")
    })
    @DeleteMapping("/{zoneId}")
    public ResponseEntity<Void> deleteZone(@PathVariable UUID matchId, @PathVariable UUID zoneId, Authentication authentication) {
        zoneAssignmentService.delete(matchId, zoneId, authentication);
        return ResponseEntity.noContent().build();
    }
}
