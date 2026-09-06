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

    @GetMapping
    public ResponseEntity<Object> findAllClubs() {
        Collection<Club> result = clubService.findAllClubs();
        return (result != null) ? ResponseEntity.ok(result) 
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro ningun club");
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<Object> findClubById(@PathVariable UUID clubId) {
        Club result = clubService.findClubById(clubId);
        return (result != null) ? ResponseEntity.ok(result) 
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
    }

    @PostMapping
    public ResponseEntity<Object> saveClub(@Valid @RequestBody Club club, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        try {
            Club result = clubService.saveClub(club);
            return ResponseEntity.ok(result);
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
        if (clubService.findClubById(clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        Collection<Division> result = divisionService.findAllDivisionsByClubId(clubId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Divisiones no encontradas");
    }

    @GetMapping("/{clubId}/division/{divisionId}")
    public ResponseEntity<Object> findDivisionByIdAndClubId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId) {
        if (clubService.findClubById(clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        Division result = divisionService.findDivisionByIdAndClubId(divisionId, clubId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");

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
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
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
        return (result != null) ? ResponseEntity.ok(result)
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
        return (result != null) ? ResponseEntity.ok(result)
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
        return (result != null) ? ResponseEntity.ok(result)
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
        return (result != null) ? ResponseEntity.ok(result)
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

    /*
     * /////////////////////////////////////////////////////////////////////////////
     * EVENT REQUESTS
     * /////////////////////////////////////////////////////////////////////////////
     */

    @GetMapping("/{clubId}/events")
    public ResponseEntity<Object> findEventsByClubId(@PathVariable UUID clubId) {
        if (clubService.findClubById(clubId) == null ) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }

        Collection<Event> result = eventService.findEventsByClubId(clubId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron eventos asociados al club");
    }

    @GetMapping("/{clubId}/division/{divisionId}/events")
    public ResponseEntity<Object> findEventsByDivisionId(@PathVariable UUID clubId, @PathVariable UUID divisionId) {
        if (clubService.findClubById(clubId) == null ) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }

        Collection<Event> result = eventService.findEventsByDivisionId(divisionId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron eventos asociados a la division");
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events")
    public ResponseEntity<Object> findEventsByMatchId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId) {

        if (clubService.findClubById(clubId) == null ) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }

        if (matchService.findMatchByIdAndDivisionId(matchId, divisionId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no encontrado");
        }

        Collection<Event> result = eventService.findEventsByMatchId(matchId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron eventos asociados al partido");
    }

    @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events/{eventId}")
    public ResponseEntity<Object> findEventByIdAndMatchId(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId,
            @PathVariable UUID eventId) {
        if (clubService.findClubById(clubId) == null ) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
        }
        if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
        }
        if (matchService.findMatchByIdAndDivisionId(matchId, divisionId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no encontrado");
        }

        Event result = eventService.findEventByIdAndMatchId(eventId, matchId);
        return (result != null) ? ResponseEntity.ok(result)
        : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro el evento asociado al partido");
    }

    @PostMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events")
    public ResponseEntity<Object> saveEvent(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId,
            @RequestBody Event event) {
        try {
            if (clubService.findClubById(clubId) == null ) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }
            Match match = matchService.findMatchByIdAndDivisionId(matchId, divisionId);
            if (match == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no encontrado");
            }
            return ResponseEntity.ok(eventService.saveEvent(match, event));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar evento");
        }
    }

    // TODO: Soft delete, change it later
    @DeleteMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events/{eventId}")
    public ResponseEntity<Object> deleteEvent(
            @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID matchId,
            @PathVariable UUID eventId) {
        try {
            if (clubService.findClubById(clubId) == null ) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no encontrado");
            }
            if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no encontrada");
            }
            Match match = matchService.findMatchByIdAndDivisionId(matchId, divisionId);
            if (match == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no encontrado");
            }
            eventService.deleteEvent(eventId, matchId);
            return ResponseEntity.ok("Evento eliminado correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error al eliminar evento, hay entidades relacionadas");
        }
    }

}
