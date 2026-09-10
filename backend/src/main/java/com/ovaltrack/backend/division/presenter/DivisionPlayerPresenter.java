package com.ovaltrack.backend.division.presenter;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionPlayerService;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerUpdateDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("players")
@Tag(name = "Division players", description = "Manage players registered in divisions")
public class DivisionPlayerPresenter {

    @Autowired 
    private DivisionPlayerService divisionPlayerService;
   
    @Operation(
        summary = "List players in a division",
        description = "Returns all players associated with the division identified by the divisionId query parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division players returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The division or request could not be processed because of a business conflict.")
    })
    @GetMapping
    public ResponseEntity<Object> findDivisionPlayersByDivisionId(@RequestParam UUID divisionId) {
        try {
            return ResponseEntity.ok(divisionPlayerService.findDivisionPlayersByDivision(divisionId));
        }   catch(BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        }
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
    public ResponseEntity<Object> findDivisionPlayerById(@PathVariable UUID divisionPlayerId) {
        DivisionPlayerResponseDTO result = divisionPlayerService.findDivisionPlayerById(divisionPlayerId);
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
        @ApiResponse(responseCode = "409", description = "The association cannot be created because of a business or data-integrity conflict.")
    })
    @PostMapping
    public ResponseEntity<Object> saveDivisionPlayer(@Valid @RequestBody DivisionPlayerCreationDTO aDivisionPlayerRequest) {
        try {
            return ResponseEntity.ok(divisionPlayerService.saveDivisionPlayer(aDivisionPlayerRequest));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar jugador en la division");
        }
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
    public ResponseEntity<Object> deleteDivisionPlayer(@PathVariable UUID divisionPlayerId) {
        try {
            divisionPlayerService.deleteDivisionPlayer(divisionPlayerId);
            return ResponseEntity.ok("Jugador eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar jugador, hay entidades relacionadas");
        }
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
        @ApiResponse(responseCode = "409", description = "The association cannot be updated because of a business or data-integrity conflict.")
    })
    @PutMapping("/{divisionPlayerId}")
    public ResponseEntity<Object> updateDivisionPlayer(@PathVariable UUID divisionPlayerId,
            @Valid @RequestBody DivisionPlayerUpdateDTO request) {
        try {
            return ResponseEntity.ok(divisionPlayerService.updateDivisionPlayer(divisionPlayerId, request));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al actualizar jugador en la division");
        }
    }

}
