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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;

@RestController
@RequestMapping("match")
public class MatchController {

	@Autowired
	private MatchService matchService;

	@GetMapping
	public ResponseEntity<Object> findAllMatches() {
		return ResponseEntity.ok(matchService.findAllMatches());
	}

	@GetMapping("/{matchId}")
	public ResponseEntity<Object> findMatchById(@PathVariable UUID matchId) {
		return ResponseEntity.ok(matchService.findMatchById(matchId));
	}

	@PostMapping
	public ResponseEntity<Object> saveMatch(@RequestBody Match match) {
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
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al eliminar partido, hay entidades relacionadas");
		}
	}
}
