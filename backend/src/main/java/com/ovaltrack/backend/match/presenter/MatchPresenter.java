package com.ovaltrack.backend.match.presenter;

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

import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.dto.MatchCreationDTO;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;
import com.ovaltrack.backend.match.domain.dto.MatchUpdateDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("matches")
@Tag(name = "Matches", description = "Create, query, update, and delete matches")
public class MatchPresenter {

    @Autowired
    private MatchService matchService;

    @Operation(
        summary = "List matches for a club",
        description = "Returns all matches associated with the club identified by the clubId query parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Matches returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The club or request could not be processed because of a business conflict.")
    })
    @GetMapping(value = "/club",params = "clubId")
    public ResponseEntity<Object> findAllMatchesByClubId(@RequestParam UUID clubId) {
        return ResponseEntity.ok(matchService.findAllMatchesByClubId(clubId));
    }

    @Operation(
        summary = "List matches for a division",
        description = "Returns all matches associated with the division identified by the divisionId query parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Matches returned successfully, even if there are none."),
        @ApiResponse(responseCode = "409", description = "The division or request could not be processed because of a business conflict.")
    })
    @GetMapping(value = "/division", params = "divisionId")
    public ResponseEntity<Object> findAllMatchesByDivisionId(@RequestParam UUID divisionId) {
        return ResponseEntity.ok(matchService.findAllMatchesByDivisionId(divisionId));
    }

    @Operation(
        summary = "Find a match",
        description = "Returns the match identified by the matchId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Match returned successfully."),
        @ApiResponse(responseCode = "404", description = "No match exists with the specified ID.")
    })
    @GetMapping("/{matchId}")
    public ResponseEntity<Object> findMatchById(@PathVariable UUID matchId) {
        MatchResponseDTO result = matchService.findMatchById(matchId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro el partido");
    }

    @Operation(
        summary = "Create a match",
        description = "Creates a match from the request body and returns the created match.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Match data required to create a match.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = MatchCreationDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Match created successfully."),
        @ApiResponse(responseCode = "409", description = "The match cannot be created because of a business or data-integrity conflict.")
    })
    @PostMapping
    public ResponseEntity<Object> saveMatch(@Valid @RequestBody MatchCreationDTO match, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(matchService.saveMatch(match));
    }

    @Operation(
        summary = "Update a match",
        description = "Updates the match identified by the matchId path parameter and returns the updated match.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Match data required to update a match.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = MatchUpdateDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Match updated successfully."),
        @ApiResponse(responseCode = "409", description = "The match cannot be updated because of a business or data-integrity conflict.")
    })
    @PutMapping("/{matchId}")
    public ResponseEntity<Object> updateMatch(
            @PathVariable UUID matchId,
            @Valid @RequestBody MatchUpdateDTO request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        return ResponseEntity.ok(matchService.updateMatch(matchId, request));
    }

    @Operation(
        summary = "Delete a match",
        description = "Deletes the match identified by the matchId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Match deleted successfully."),
        @ApiResponse(responseCode = "409", description = "The match cannot be deleted because of a business or data-integrity conflict.")
    })
    @DeleteMapping("/{matchId}")
    public ResponseEntity<Object> deleteMatch(@PathVariable UUID matchId) {
        matchService.deleteMatch(matchId);
        return ResponseEntity.ok("Partido eliminado correctamente");
    }

}
