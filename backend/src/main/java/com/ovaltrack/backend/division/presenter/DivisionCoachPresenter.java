package com.ovaltrack.backend.division.presenter;

import java.util.Collection;
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
import com.ovaltrack.backend.division.business.DivisionCoachService;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachResponseDTO;


@RestController
@RequestMapping("coaches")
public class DivisionCoachPresenter {

    @Autowired 
    private DivisionCoachService divisionCoachService;

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION_COACH REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping
    public ResponseEntity<Object> findDivisionCoachesByDivisionId(@RequestParam UUID divisionId) {
        Collection<DivisionCoachResponseDTO> result = divisionCoachService.findDivisionCoachesByDivisionId(divisionId);
        return (!result.isEmpty()) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron entrenadores asociados a la division");
    }

    @GetMapping("/{divisionCoachId}")
    public ResponseEntity<Object> findDivisionCoachById(@PathVariable UUID divisionCoachId) {
        DivisionCoachResponseDTO result = divisionCoachService.findDivisionCoachById(divisionCoachId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro al entrenador asociado a la division");

    }

    @PostMapping
    public ResponseEntity<Object> saveDivisionCoach(@RequestBody DivisionCoachCreationDTO divisionCoach) {
        try {
            return ResponseEntity.ok(divisionCoachService.saveDivisionCoach(divisionCoach));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar entrenador en la division");
        }
    }

    @DeleteMapping("/{divisionCoachId}")
    public ResponseEntity<Object> deleteDivisionCoach(@PathVariable UUID divisionCoachId) {
        try {
            divisionCoachService.deleteDivisionCoach(divisionCoachId);
            return ResponseEntity.ok("Entrenador eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar entrenador, hay entidades relacionadas");
        }
    }

}
