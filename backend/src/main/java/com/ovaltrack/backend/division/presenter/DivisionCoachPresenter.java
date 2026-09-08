package com.ovaltrack.backend.division.presenter;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.division.business.DivisionCoachService;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionUpdateDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerCreationDTO;

import jakarta.validation.Valid;

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

    @GetMapping("/{clubId}/division/{divisionId}/coaches/{divisionCoachId}")
    public ResponseEntity<Object> findDivisionCoachByIdAndDivisionId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID divisionCoachId) {
        if (clubService.findClubById(clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }

        DivisionCoach result = divisionService.findDivisionCoachByIdAndDivisionId(divisionCoachId, divisionId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro al entrenador asociado a la division");

    }

    @PostMapping("/{clubId}/division/{divisionId}/coaches")
    public ResponseEntity<Object> saveDivisionCoach(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @RequestBody DivisionCoach divisionCoach) {
        try {
            if (clubService.findClubById(clubId) == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }

            DivisionCoach result = divisionService.saveDivisionCoach(divisionService.findDivisionByIdAndClubId(divisionId, clubId), divisionCoach);
            return ResponseEntity.ok(result);

        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar entrenador en la division");
        }
    }

    @DeleteMapping("/{clubId}/division/{divisionId}/coaches/{divisionCoachId}")
    public ResponseEntity<Object> deleteDivisionCoach(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID divisionCoachId) {
        try {
            Club aClub = clubService.findClubById(clubId);
            if (aClub == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            Division aDivision = divisionService.findDivisionByIdAndClubId(divisionId, clubId);
            if (aDivision == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }

            divisionService.deleteDivisionCoach(aClub, aDivision, divisionCoachId);
            return ResponseEntity.ok("Entrenador eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar entrenador, hay entidades relacionadas");
        }
    }

}
