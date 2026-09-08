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

import jakarta.validation.Valid;

@RestController
@RequestMapping("players")
public class DivisionPlayerPresenter {

    @Autowired 
    private DivisionPlayerService divisionPlayerService;
   
    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION_PLAYER REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping
    public ResponseEntity<Object> findDivisionPlayersByDivisionId(@RequestParam UUID divisionId) {
        try {
            return ResponseEntity.ok(divisionPlayerService.findDivisionPlayersByDivision(divisionId));
        }   catch(BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        }
    }

    @GetMapping("/{divisionPlayerId}")
    public ResponseEntity<Object> findDivisionPlayerById(@PathVariable UUID divisionPlayerId) {
        DivisionPlayerResponseDTO result = divisionPlayerService.findDivisionPlayerById(divisionPlayerId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro al jugador asociado a la division");
    }

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
