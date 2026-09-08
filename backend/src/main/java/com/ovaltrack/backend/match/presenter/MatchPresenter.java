package com.ovaltrack.backend.match.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.event.business.EventService;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;

import jakarta.validation.Valid;

@RestController
@RequestMapping("club")
public class MatchPresenter {

    @Autowired
    private MatchService matchService;

 
//TODO: Adapt match services to use DTOs instead of JPA entities. Adapt endpoints
    /*
     * /////////////////////////////////////////////////////////////////////////////
     * MATCH REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/matches")
    public ResponseEntity<Object> findAllMatchesByClubId(@PathVariable UUID clubId) {
        if (clubService.findClubById(clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        Collection<Match> result = matchService.findAllMatchesByClubId(clubId);
        return (!result.isEmpty()) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron partidos asociados al club");
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches")
    public ResponseEntity<Object> findAllMatchesByDivisionIdAndClubId(@PathVariable UUID clubId, @PathVariable UUID divisionId) {
        if (clubService.findClubById(clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }
        Collection<Match> result = matchService.findAllMatchesByDivisionId(divisionId);
        return (!result.isEmpty()) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron partidos asociados a la division");
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}")
    public ResponseEntity<Object> findMatchByIdAndDivisionId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId) {
        if (clubService.findClubById(clubId) == null ) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }
        Match result = matchService.findMatchByIdAndDivisionId(matchId, divisionId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro el partido");
    }

    @PostMapping("/{clubId}/division/{divisionId}/matches")
    public ResponseEntity<Object> saveMatch(@PathVariable UUID clubId, @PathVariable UUID divisionId,
            @RequestBody Match match) {
        try {
            if (clubService.findClubById(clubId) == null ) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            Division aDivision = divisionService.findDivisionByIdAndClubId(divisionId, clubId);
            if (aDivision == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }

            Match result = matchService.saveMatch(aDivision, match);
            return ResponseEntity.ok(result);

        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar partido");
        }
    }

    @DeleteMapping("/{clubId}/division/{divisionId}/matches/{matchId}")
    public ResponseEntity<Object> deleteMatch(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId) {
        try {
            if (clubService.findClubById(clubId) == null ) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }

            matchService.deleteMatch(divisionId, matchId);
            return ResponseEntity.ok("Partido eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar partido, hay entidades relacionadas");
        }
    }

}
