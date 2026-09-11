package com.ovaltrack.backend.club.presenter;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.dto.ClubCreationDTO;
import com.ovaltrack.backend.club.domain.dto.ClubResponseDTO;
import com.ovaltrack.backend.club.domain.dto.ClubUpdateDTO;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("club")
@Tag(name = "Clubs", description = "Create, query, update, and delete clubs")
public class ClubController {

    private ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @Operation(
        summary = "Get current authenticated user's club",
        description = "Returns the club managed by the authenticated club admin."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Club returned successfully."),
        @ApiResponse(responseCode = "404", description = "No club is associated with the authenticated user."),
        @ApiResponse(responseCode = "409", description = "Business conflict or unauthenticated access.")
    })
    @GetMapping("/my-club")
    public ResponseEntity<Object> getMyClub(org.springframework.security.core.Authentication authentication) {
        try {
            ClubResponseDTO result = clubService.findClubForAuthenticatedUser(authentication);
            return (result != null) ? ResponseEntity.ok(result)
                    : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        }
    }

    @Operation(
        summary = "List all clubs in the system",
        description = "Returns every club registered in the system."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Clubs returned successfully, even if there are none.")
    })
    @GetMapping
    public ResponseEntity<Object> findAllClubs() {
        return ResponseEntity.ok(clubService.findAllClubs());
    }


    @Operation(
        summary = "Find a specific club in the system",
        description = "Return the specified club in the path variable."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Clubs returned successfully."),
        @ApiResponse(responseCode = "404", description = "The ID does not belong to any club in the system.")
    })
    @GetMapping("/{clubId}")
    public ResponseEntity<Object> findClubById(@PathVariable UUID clubId) {
        ClubResponseDTO result = clubService.findClubById(clubId);
        return (result != null) ? ResponseEntity.ok(result)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
    }


    @Operation(
        summary = "Create a club in the system",
        description = "Creates a club in the system and returns it",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Club data required to create a club.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = ClubCreationDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Club created successfully."),
        @ApiResponse(responseCode = "409", description = "The request is invalid or the club cannot be saved because of a business or data-integrity conflict.")
    })
    @PostMapping
    public ResponseEntity<Object> saveClub(@Valid @RequestBody ClubCreationDTO aClub, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        try {
            return ResponseEntity.ok(clubService.saveClub(aClub));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar club");
        }
    }


    @Operation(
        summary = "Updates a club in the system",
        description = "Updates a club in the system and returns it",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Club data required to update a club.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = ClubUpdateDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Club updated successfully."),
        @ApiResponse(responseCode = "409", description = "The club cannot be updated because of a business or data-integrity conflict.")
    })
    @PutMapping("/{clubId}")
    public ResponseEntity<Object> updateClub(@PathVariable UUID clubId, @Valid @RequestBody ClubUpdateDTO request,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        try {
            return ResponseEntity.ok(clubService.updateClub(clubId, request));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al actualizar club");
        }
    }

    @Operation(
        summary = "Delete a club",
        description = "Deletes the club identified by the UUID. The operation fails when related entities prevent deletion."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Club deleted successfully."),
        @ApiResponse(responseCode = "409", description = "The club cannot be deleted because of a business or data-integrity conflict.")
    })
    @DeleteMapping("/{clubId}")
    public ResponseEntity<Object> deleteClub(@PathVariable UUID clubId) {
        try {
            clubService.deleteClub(clubId);
            return ResponseEntity.ok("Club eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar club, hay entidades relacionadas");
        }

    }

}
