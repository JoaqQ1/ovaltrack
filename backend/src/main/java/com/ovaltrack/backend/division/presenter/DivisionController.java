package com.ovaltrack.backend.division.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;

@RestController
@RequestMapping("division")
public class DivisionController {

	@Autowired
	private DivisionService divisionService;

	@GetMapping
	public ResponseEntity<Collection<Division>> findAllDivisions() {
		return ResponseEntity.ok(divisionService.findAllDivisions());
	}

	@PostMapping
	public ResponseEntity<Division> saveDivision(@RequestBody Division division) {
		return ResponseEntity.ok(divisionService.saveDivision(division));
	}

	@DeleteMapping("/{divisionId}")
	public ResponseEntity<Void> deleteDivision(@PathVariable UUID divisionId) {
		divisionService.deleteDivision(divisionId);
		return ResponseEntity.noContent().build();
	}
}
