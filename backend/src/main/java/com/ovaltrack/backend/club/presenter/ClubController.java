package com.ovaltrack.backend.club.presenter;

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
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.event.business.EventService;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;

import jakarta.validation.Valid;

@RestController
@RequestMapping("club")
public class ClubController {

    @Autowired
    ClubService clubService;

    @Autowired
    private DivisionService divisionService;

    @Autowired
    private MatchService matchService;

    @Autowired
    private EventService eventService;

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * CLUB REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    // Creation of object instead of sending the result directly from the function
    @GetMapping
    public ResponseEntity<Object> findAllClubs() {
        Collection<Club> allClubs = clubService.findAllClubs();
        return ResponseEntity.ok(allClubs);
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<Object> findClubById(@PathVariable UUID clubId) {
        return ResponseEntity.ok(clubService.findClubById(clubId));
    }

    @PostMapping
    public ResponseEntity<Object> saveClub(@Valid @RequestBody Club club, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        try {
            return ResponseEntity.ok(clubService.saveClub(club));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar club");
        }
    }

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

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/division")
    public ResponseEntity<Object> findAllDivisionsByClubId(@PathVariable UUID clubId) {
        return ResponseEntity.ok(divisionService.findAllDivisionsByClubId(clubId));
    }

    @GetMapping("/{clubId}/division/{divisionId}")
    public ResponseEntity<Object> findDivisionById(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
        return ResponseEntity.ok(divisionService.findDivisionById(divisionId));
    }

    @PostMapping("/{clubId}/division")
    public ResponseEntity<Object> saveDivision(
            @PathVariable UUID clubId, @Valid @RequestBody Division division, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }

        try {
            Club aClub = clubService.findClubById(clubId);

            if (aClub == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Club no encontrado");
            }

            Division aDivision = divisionService.saveDivision(aClub, division);
            return ResponseEntity.ok(aDivision);

        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar division");
        }
    }

    @DeleteMapping("/{clubId}/division/{divisionId}")
    public ResponseEntity<Object> deleteDivision(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
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

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * DIVISION_PLAYER REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/division/{divisionId}/players")
    public ResponseEntity<Object> findDivisionPlayers(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
        return ResponseEntity.ok(divisionService.findDivisionPlayersByDivision(divisionId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/players/{divisionPlayerId}")
    public ResponseEntity<Object> findDivisionPlayerById(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID divisionPlayerId) {
        return ResponseEntity.ok(divisionService.findDivisionPlayerById(divisionPlayerId));
    }

    @PostMapping("/{clubId}/division/{divisionId}/players")
    public ResponseEntity<Object> saveDivisionPlayer(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @RequestBody DivisionPlayer divisionPlayer) {
        try {

            Division aDivision = divisionService.findDivisionById(divisionId);
            if (aDivision == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Division no encontrada");
            }

            DivisionPlayer aDivisionPlayer = divisionService.saveDivisionPlayer(aDivision, divisionPlayer);
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
            divisionService.deleteDivisionPlayer(divisionPlayerId);
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
    public ResponseEntity<Object> findDivisionCoaches(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
        return ResponseEntity.ok(divisionService.findDivisionCoachesByDivisionId(divisionId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/coaches/{divisionCoachId}")
    public ResponseEntity<Object> findDivisionCoachById(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID divisionCoachId) {
        return ResponseEntity.ok(divisionService.findDivisionCoachById(divisionCoachId));
    }

    @PostMapping("/{clubId}/division/{divisionId}/coaches")
    public ResponseEntity<Object> saveDivisionCoach(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @RequestBody DivisionCoach divisionCoach) {
        try {

            Division aDivision = divisionService.findDivisionById(divisionId);
            if (aDivision == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Division no encontrada");
            }

            DivisionCoach aDivisionCoach = divisionService.saveDivisionCoach(aDivision, divisionCoach);
            return ResponseEntity.ok(aDivisionCoach);

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
            divisionService.deleteDivisionCoach(divisionCoachId);
            return ResponseEntity.ok("Entrenador eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar entrenador, hay entidades relacionadas");
        }
    }

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * MATCH REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/matches")
    public ResponseEntity<Object> findAllMatchesByClubId(@PathVariable UUID clubId) {
        return ResponseEntity.ok(matchService.findAllMatchesByClubId(clubId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches")
    public ResponseEntity<Object> findAllMatchesByDivisionId(@PathVariable UUID clubId, @PathVariable UUID divisionId) {
        return ResponseEntity.ok(matchService.findAllMatchesByDivisionId(divisionId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}")
    public ResponseEntity<Object> findMatchById(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId) {
        return ResponseEntity.ok(matchService.findMatchById(matchId));
    }

    @PostMapping("/{clubId}/division/{divisionId}/matches")
    public ResponseEntity<Object> saveMatch(@PathVariable UUID clubId, @PathVariable UUID divisionId,
            @RequestBody Match match) {
        try {
            Division aDivision = divisionService.findDivisionById(divisionId);
            if (aDivision == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Division no encontrada");
            }

            Match result = matchService.saveMatch(aDivision, match);

            return ResponseEntity.ok(result);

        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar partido");
        }
    }

    @DeleteMapping("/{clubId}/matches/{matchId}")
    public ResponseEntity<Object> deleteMatch(
            @PathVariable UUID clubId, @PathVariable UUID matchId) {
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

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * EVENT REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/events")
    public ResponseEntity<Object> findEventsByClubId(@PathVariable UUID clubId) {
        return ResponseEntity.ok(eventService.findEventsByClubId(clubId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/events")
    public ResponseEntity<Object> findEventsByDivisionId(@PathVariable UUID clubId, @PathVariable UUID divisionId) {
        return ResponseEntity.ok(eventService.findEventsByDivisionId(divisionId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events")
    public ResponseEntity<Object> findEventsByMatchId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId) {
        return ResponseEntity.ok(eventService.findEventsByMatchId(matchId));
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events/{eventId}")
    public ResponseEntity<Object> findEventById(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId, @PathVariable UUID eventId) {
        return ResponseEntity.ok(eventService.findEventById(eventId));
    }

    @PostMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events")
    public ResponseEntity<Object> saveEvent(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId, @RequestBody Event event) {
        try {
            return ResponseEntity.ok(eventService.saveEvent(event));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar evento");
        }
    }

    // TODO: Soft delete, change it later
    @DeleteMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events/{eventId}")
    public ResponseEntity<Object> deleteEvent(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId, @PathVariable UUID eventId) {
        try {
            eventService.deleteEvent(eventId);
            return ResponseEntity.ok("Evento eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar evento, hay entidades relacionadas");
        }
    }

}
