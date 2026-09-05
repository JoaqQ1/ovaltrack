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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("division")
public class DivisionController {

	@Autowired
	private DivisionService divisionService;

	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION REQUESTS
	 * /////////////////////////////////////////////////////////////////////////////
	 */

	//TODO: PathVariable clubId
	@GetMapping
	public ResponseEntity<Object> findAllDivisionsByClubId(UUID clubId) {
		return ResponseEntity.ok(divisionService.findAllDivisionsByClubId(clubId));
	}

	@GetMapping("/{divisionId}")
	public ResponseEntity<Object> findDivisionById(@PathVariable UUID divisionId) {
		return ResponseEntity.ok(divisionService.findDivisionById(divisionId));
	}

	@PostMapping
	public ResponseEntity<Object> saveDivision(@Valid @RequestBody Division division, BindingResult bindingResult) {
		if (bindingResult.hasErrors()) {
			String message = bindingResult.getFieldError().getDefaultMessage();
			return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
		}
		try {
			return ResponseEntity.ok(divisionService.saveDivision(division));
		} catch (BusinessException anError) {
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

	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION_PLAYER REQUESTS
	 * /////////////////////////////////////////////////////////////////////////////
	 */

	@GetMapping("/{divisionId}/players")
	public ResponseEntity<Object> findDivisionPlayers(@PathVariable UUID divisionId) {
		return ResponseEntity.ok(divisionService.findDivisionPlayersByDivision(divisionId));
	}

	@GetMapping("/{divisionId}/players/{divisionPlayerId}")
	public ResponseEntity<Object> findDivisionPlayerById(@PathVariable UUID divisionPlayerId) {
		return ResponseEntity.ok(divisionService.findDivisionPlayerById(divisionPlayerId));
	}

	@PostMapping("/{divisionId}/players")
	public ResponseEntity<Object> saveDivisionPlayer(
			@PathVariable UUID divisionId, @RequestBody DivisionPlayer divisionPlayer) {
		try {
			return ResponseEntity.ok(divisionService.saveDivisionPlayer(divisionId, divisionPlayer));
		} catch (BusinessException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
		} catch (DataIntegrityViolationException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar jugador en la division");
		}
	}

	@DeleteMapping("/{divisionId}/players/{divisionPlayerId}")
	public ResponseEntity<Object> deleteDivisionPlayer(@PathVariable UUID divisionPlayerId) {
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

	@GetMapping("/{divisionId}/coaches")
	public ResponseEntity<Object> findDivisionCoaches(@PathVariable UUID divisionId) {
		return ResponseEntity.ok(divisionService.findDivisionCoachesByDivisionId(divisionId));
	}

	@GetMapping("/{divisionId}/coaches/{divisionCoachId}")
	public ResponseEntity<Object> findDivisionCoachById(@PathVariable UUID divisionCoachId) {
		return ResponseEntity.ok(divisionService.findDivisionCoachById(divisionCoachId));
	}

	@PostMapping("/{divisionId}/coaches")
	public ResponseEntity<Object> saveDivisionCoach(
			@PathVariable UUID divisionId, @RequestBody DivisionCoach divisionCoach) {
		try {
			return ResponseEntity.ok(divisionService.saveDivisionCoach(divisionId, divisionCoach));
		} catch (BusinessException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
		} catch (DataIntegrityViolationException anError) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar entrenador en la division");
		}
	}

	@DeleteMapping("/{divisionId}/coaches/{divisionCoachId}")
	public ResponseEntity<Object> deleteDivisionCoach(@PathVariable UUID divisionCoachId) {
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
}
