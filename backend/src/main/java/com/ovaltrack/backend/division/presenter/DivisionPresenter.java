package com.ovaltrack.backend.division.presenter;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionUpdateDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("division")
public class DivisionPresenter {

    @Autowired
    private DivisionService divisionService;

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping
    public ResponseEntity<Object> findAllDivisionsByClubId(@RequestParam UUID clubId) {
        try {
            return ResponseEntity.ok(divisionService.findAllDivisionsByClubId(clubId));
        }   catch(BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        }
    }

    @GetMapping("/{divisionId}")
    public ResponseEntity<Object> findDivisionById(@PathVariable UUID divisionId) {
        DivisionResponseDTO result = divisionService.findDivisionById(divisionId);
        return (result != null) ? ResponseEntity.ok(result) 
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
    }

    @PostMapping
    public ResponseEntity<Object> saveDivision(@Valid @RequestBody DivisionCreationDTO aDivisionRequest, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }

        try {
            return ResponseEntity.ok(divisionService.saveDivision(aDivisionRequest));
        }  catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar division");
        }
    }

    @DeleteMapping("/{divisionId}")
    public ResponseEntity<Object> deleteDivision(@PathVariable UUID divisionId) {
        try {
            divisionService.deleteDivision(divisionId);
            return ResponseEntity.ok("Division eliminada correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar division, hay entidades relacionadas");
        }
    }

    @PutMapping("/{divisionId}")
    public ResponseEntity<Object> updateDivision(@PathVariable UUID divisionId, @Valid @RequestBody DivisionUpdateDTO request,
            BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(bindingResult.getFieldError().getDefaultMessage());
        }

        try {
            return ResponseEntity.ok(divisionService.updateDivision(divisionId, request));
        } catch (BusinessException error) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error.getMessage());
        } catch (DataIntegrityViolationException error) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al actualizar la division");
        }
    }

}
