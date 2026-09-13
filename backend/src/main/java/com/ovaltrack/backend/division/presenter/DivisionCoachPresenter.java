package com.ovaltrack.backend.division.presenter;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.division.business.DivisionCoachService;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("coaches")
@Tag(name = "Division coaches", description = "Manage coaches registered in divisions")
public class DivisionCoachPresenter {

    @Autowired 
    private DivisionCoachService divisionCoachService;

    @Operation(
        summary = "List coaches in a division",
        description = "Returns all coaches associated with the division identified by the divisionId query parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division coaches returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The division or request could not be processed because of a business conflict.")
    })
    @GetMapping
    public ResponseEntity<Object> findDivisionCoachesByDivisionId(@RequestParam UUID divisionId) {
        return ResponseEntity.ok(divisionCoachService.findDivisionCoachesByDivisionId(divisionId));
    }

    @Operation(
        summary = "Find a division coach",
        description = "Returns the division-coach association identified by the divisionCoachId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division coach returned successfully."),
        @ApiResponse(responseCode = "404", description = "No coach association exists with the specified ID.")
    })
    @GetMapping("/{divisionCoachId}")
    public ResponseEntity<Object> findDivisionCoachById(@PathVariable UUID divisionCoachId) {
        DivisionCoachResponseDTO result = divisionCoachService.findDivisionCoachById(divisionCoachId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro al entrenador asociado a la division");

    }

    @Operation(
        summary = "Register a coach in a division",
        description = "Creates a division-coach association from the request body and returns it.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Coach data required to register a coach in a division.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DivisionCoachCreationDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Coach registered in the division successfully."),
        @ApiResponse(responseCode = "409", description = "The association cannot be created because of a business or data-integrity conflict.")
    })
    @PostMapping
    public ResponseEntity<Object> saveDivisionCoach(@Valid @RequestBody DivisionCoachCreationDTO divisionCoach, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(divisionCoachService.saveDivisionCoach(divisionCoach));
    }

    @Operation(
        summary = "Remove a coach from a division",
        description = "Deletes the division-coach association identified by the divisionCoachId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Coach removed from the division successfully."),
        @ApiResponse(responseCode = "409", description = "The association cannot be deleted because of a business or data-integrity conflict.")
    })
    @DeleteMapping("/{divisionCoachId}")
    public ResponseEntity<Object> deleteDivisionCoach(@PathVariable UUID divisionCoachId) {
        divisionCoachService.deleteDivisionCoach(divisionCoachId);
        return ResponseEntity.ok("Entrenador eliminado correctamente");
    }

}
