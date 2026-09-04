package com.ovaltrack.backend.division.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
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

import jakarta.validation.Valid;

@RestController
@RequestMapping("division")
public class DivisionController {

	@Autowired
	private DivisionService divisionService;

	@GetMapping
	public ResponseEntity<Object> findAllDivisions() {
		return ResponseEntity.ok(divisionService.findAllDivisions());
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
		return ResponseEntity.ok(divisionService.saveDivision(division));
	}

	@DeleteMapping("/{divisionId}")
	public ResponseEntity<Object> deleteDivision(@PathVariable UUID divisionId) {
		divisionService.deleteDivision(divisionId);
		return ResponseEntity.ok("Division eliminada correctamente");
	}
}
