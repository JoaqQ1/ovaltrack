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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.domain.dto.DivisionResponseDTO;

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
        return ResponseEntity.ok(divisionService.findAllDivisionsByClubId(clubId))
        try {
            return ResponseEntity.ok(divisionService.findAllDivisionsByClubId(clubId));
        } catch (EntityNotFoundException anError) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(anError.getMessage());
        }
    }

    @GetMapping("/{divisionId}")
    public ResponseEntity<Object> findDivisionById(@PathVariable UUID divisionId) {
        return ResponseEntity.ok(divisionService.findDivisionById(divisionId));
    }

    @PostMapping
    public ResponseEntity<Object> saveDivision(
            @RequestParam UUID clubId, @Valid @RequestBody Division aDivision, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }

        try {

            Division result = divisionService.saveDivision(clubId, aDivision);
            return ResponseEntity.ok(result);
 
        }  catch (EntityNotFoundException anError) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(anError.getMessage());
        }  catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar division");
        }
    }

    @DeleteMapping("/{clubId}/division/{divisionId}")
    public ResponseEntity<Object> deleteDivision(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
        try {
            Club aClub = clubService.findClubById(clubId);
            if (aClub == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }

            divisionService.deleteDivision(aClub, divisionId);
            return ResponseEntity.ok("Division eliminada correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar division, hay entidades relacionadas");
        }
    }

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION_PLAYER REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/division/{divisionId}/players")
    public ResponseEntity<Object> findDivisionPlayers(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {

        if (clubService.findClubById(clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }

        Collection<DivisionPlayer> result = divisionService.findDivisionPlayersByDivision(divisionId);
        return (!result.isEmpty()) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron jugadores asociados a la division");

    }

    @GetMapping("/{clubId}/division/{divisionId}/players/{divisionPlayerId}")
    public ResponseEntity<Object> findDivisionPlayerByIdAndDivisionId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID divisionPlayerId) {
        if (clubService.findClubById(clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }

        DivisionPlayer result = divisionService.findDivisionPlayerByIdAndDivisionId(divisionPlayerId, divisionId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro al jugador asociado a la division");
    }

    @PostMapping("/{clubId}/division/{divisionId}/players")
    public ResponseEntity<Object> saveDivisionPlayer(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @RequestBody DivisionPlayer divisionPlayer) {
        try {
            if (clubService.findClubById(clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }

            DivisionPlayer aDivisionPlayer = divisionService.saveDivisionPlayer(divisionService.findDivisionByIdAndClubId(divisionId, clubId), divisionPlayer);
            return ResponseEntity.ok(aDivisionPlayer);

        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar jugador en la division");
        }
    }

    @DeleteMapping("/{clubId}/division/{divisionId}/players/{divisionPlayerId}")
    public ResponseEntity<Object> deleteDivisionPlayer(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID divisionPlayerId) {
        try {
            Club aClub = clubService.findClubById(clubId);
            if (aClub == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            Division aDivision = divisionService.findDivisionByIdAndClubId(divisionId, clubId);
            if (aDivision == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }

            divisionService.deleteDivisionPlayer(aClub, aDivision, divisionPlayerId);
            return ResponseEntity.ok("Jugador eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar jugador, hay entidades relacionadas");
        }
    }

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION_COACH REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/division/{divisionId}/coaches")
    public ResponseEntity<Object> findDivisionCoachesByDivisionId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
        if (clubService.findClubById(clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }

        Collection<DivisionCoach> result = divisionService.findDivisionCoachesByClubIdAndDivisionId(clubId, divisionId);
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
