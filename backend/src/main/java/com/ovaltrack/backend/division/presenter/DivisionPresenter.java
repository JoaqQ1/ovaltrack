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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionUpdateDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("division")
@Tag(name = "Divisions", description = "Create, query, update, and delete club divisions")
public class DivisionPresenter {

    @Autowired
    private DivisionService divisionService;


    @Operation(
        summary = "List divisions for a club",
        description = "Returns all divisions associated with the club identified by the clubId query parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Divisions returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The club or request could not be processed because of a business conflict.")
    })
    @GetMapping
    public ResponseEntity<Object> findAllDivisionsByClubId(@RequestParam UUID clubId) {
        return ResponseEntity.ok(divisionService.findAllDivisionsByClubId(clubId));
    }

    @Operation(
        summary = "Find a division",
        description = "Returns the division identified by the divisionId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division returned successfully."),
        @ApiResponse(responseCode = "404", description = "No division exists with the specified ID.")
    })
    @GetMapping("/{divisionId}")
    public ResponseEntity<Object> findDivisionById(@PathVariable UUID divisionId) {
        DivisionResponseDTO result = divisionService.findDivisionById(divisionId);
        return (result != null) ? ResponseEntity.ok(result) 
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
    }

    @Operation(
        summary = "Create a division",
        description = "Creates a division from the request body and returns the created division.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Division data required to create a division.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DivisionCreationDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division created successfully."),
        @ApiResponse(responseCode = "409", description = "The division cannot be saved because of a business or data-integrity conflict.")
    })
    @PostMapping
    public ResponseEntity<Object> saveDivision(@Valid @RequestBody DivisionCreationDTO aDivisionRequest, BindingResult bindingResult,
            org.springframework.security.core.Authentication authentication) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }

        return ResponseEntity.ok(divisionService.saveDivision(aDivisionRequest, authentication));
    }

    @Operation(
        summary = "Delete a division",
        description = "Deletes the division identified by the divisionId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division deleted successfully."),
        @ApiResponse(responseCode = "409", description = "The division cannot be deleted because of a business or data-integrity conflict.")
    })
    @DeleteMapping("/{divisionId}")
    public ResponseEntity<Object> deleteDivision(@PathVariable UUID divisionId) {
        divisionService.deleteDivision(divisionId);
        return ResponseEntity.ok("Division eliminada correctamente");
    }

    @Operation(
        summary = "Update a division",
        description = "Updates the division identified by the divisionId path parameter and returns the updated division.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Division data required to update a division.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DivisionUpdateDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Division updated successfully."),
        @ApiResponse(responseCode = "409", description = "The division cannot be updated because of a business or data-integrity conflict.")
    })
    @PutMapping("/{divisionId}")
    public ResponseEntity<Object> updateDivision(@PathVariable UUID divisionId, @Valid @RequestBody DivisionUpdateDTO request,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(divisionService.updateDivision(divisionId, request));
    }

}
