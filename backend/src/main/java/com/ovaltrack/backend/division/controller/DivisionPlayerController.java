package com.ovaltrack.backend.division.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

import com.ovaltrack.backend.division.business.DivisionPlayerService;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerUpdateDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("players")
@Tag(name = "Division players", description = "Manage players registered in divisions")
@RequiredArgsConstructor
public class DivisionPlayerController {

    private final DivisionPlayerService divisionPlayerService;
   
    @Operation(
        summary = "List active players in a division",
        description = "Returns all active players associated with the division identified by the divisionId query parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division players returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The division or request could not be processed because of a business conflict.")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<Object> findDivisionPlayersByDivisionId(
            @RequestParam UUID divisionId,
            Authentication authentication) {
        return ResponseEntity.ok(divisionPlayerService.findDivisionPlayersByDivision(divisionId, authentication));
    }

    @Operation(
        summary = "List the history of a DivisionPlayer",
        description = "Returns all DivisionPlayers based on the request parameters divisionId and personId"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division players returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The division or request could not be processed because of a business conflict.")
    })
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<Object> findDivisionPlayersByDivisionIdAndPersonId(
            @RequestParam UUID divisionId,
            @RequestParam UUID personId,
            Authentication authentication) {
        return ResponseEntity.ok(divisionPlayerService.findDivisionPlayersByDivisionIdAndPersonId(divisionId, personId, authentication));
    }



    @Operation(
        summary = "Find a division player",
        description = "Returns the division-player association identified by the divisionPlayerId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division player returned successfully."),
        @ApiResponse(responseCode = "404", description = "No player association exists with the specified ID.")
    })
    @GetMapping("/{divisionPlayerId}")
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<Object> findDivisionPlayerById(
            @PathVariable UUID divisionPlayerId,
            Authentication authentication) {
        DivisionPlayerResponseDTO result = divisionPlayerService.findDivisionPlayerById(divisionPlayerId, authentication);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro al jugador asociado a la division");
    }

    @Operation(
        summary = "Register a player in a division",
        description = "Creates a division-player association from the request body and returns it.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Player data required to register a player in a division.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DivisionPlayerCreationDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Player registered in the division successfully."),
        @ApiResponse(responseCode = "400", description = "The request body contains malformed JSON or invalid request data."),
        @ApiResponse(responseCode = "409", description = "The association cannot be created because of a business or data-integrity conflict.")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<Object> saveDivisionPlayer(
            @Valid @RequestBody DivisionPlayerCreationDTO aDivisionPlayerRequest,
            BindingResult bindingResult,
            Authentication authentication) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(divisionPlayerService.saveDivisionPlayer(aDivisionPlayerRequest, authentication));
    }

    @Operation(
        summary = "Remove a player from a division",
        description = "Deletes the division-player association identified by the divisionPlayerId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Player removed from the division successfully."),
        @ApiResponse(responseCode = "409", description = "The association cannot be deleted because of a business or data-integrity conflict.")
    })
    @DeleteMapping("/{divisionPlayerId}")
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<Object> deleteDivisionPlayer(
            @PathVariable UUID divisionPlayerId,
            Authentication authentication) {
        divisionPlayerService.deleteDivisionPlayer(divisionPlayerId, authentication);
        return ResponseEntity.ok("Jugador eliminado correctamente");
    }

    @Operation(
        summary = "Update a division player",
        description = "Updates the division-player association identified by the divisionPlayerId path parameter.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Player data required to update the division-player association.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DivisionPlayerUpdateDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division player updated successfully."),
        @ApiResponse(responseCode = "400", description = "The request body contains malformed JSON or invalid request data."),
        @ApiResponse(responseCode = "409", description = "The association cannot be updated because of a business or data-integrity conflict.")
    })
    @PutMapping("/{divisionPlayerId}")
    @PreAuthorize("hasAnyRole('ADMIN_CLUB', 'COACH_ANALYST', 'ADMIN_OVALTRACK')")
    public ResponseEntity<Object> updateDivisionPlayer(
            @PathVariable UUID divisionPlayerId,
            @Valid @RequestBody DivisionPlayerUpdateDTO request,
            BindingResult bindingResult,
            Authentication authentication) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(divisionPlayerService.updateDivisionPlayer(divisionPlayerId, request, authentication));
    }

}
