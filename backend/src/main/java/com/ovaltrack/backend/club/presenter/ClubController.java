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

import jakarta.validation.Valid;

@RestController
@RequestMapping("club")
public class ClubController {
    
    @Autowired
    ClubService clubService;

    //Creation of object instead of sending the result directly from the function
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
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al eliminar club, hay entidades relacionadas");
        }

    }
}
