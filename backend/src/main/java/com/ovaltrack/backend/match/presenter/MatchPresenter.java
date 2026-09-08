package com.ovaltrack.backend.match.presenter;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.dto.MatchCreationDTO;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;

@RestController
@RequestMapping("matches")
public class MatchPresenter {

    @Autowired
    private MatchService matchService;

 
//TODO: Adapt match services to use DTOs instead of JPA entities. Adapt endpoints
    /*
     * /////////////////////////////////////////////////////////////////////////////
     * MATCH REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping
    public ResponseEntity<Object> findAllMatchesByClubId(@RequestParam UUID clubId) {
        try {
            return ResponseEntity.ok(matchService.findAllMatchesByClubId(clubId));
        }   catch(BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Object> findAllMatchesByDivisionId(@RequestParam UUID divisionId) {
        try {
            return ResponseEntity.ok(matchService.findAllMatchesByDivisionId(divisionId));
        }   catch(BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        }
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<Object> findMatchById(@PathVariable UUID matchId) {
        MatchResponseDTO result = matchService.findMatchById(matchId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro el partido");
    }

    @PostMapping
    public ResponseEntity<Object> saveMatch(@RequestBody MatchCreationDTO match) {
        try {
            return ResponseEntity.ok(matchService.saveMatch(match));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar partido");
        }
    }

    @DeleteMapping("/{matchId}")
    public ResponseEntity<Object> deleteMatch(@PathVariable UUID matchId) {
        try {
            matchService.deleteMatch(matchId);
            return ResponseEntity.ok("Partido eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar partido, hay entidades relacionadas");
        }
    }

}
