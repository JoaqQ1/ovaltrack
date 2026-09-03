package com.ovaltrack.backend.club.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;


import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;

@RestController
@RequestMapping("club")
public class ClubController {
    
    @Autowired
    ClubService clubService;

    //Creation of object instead of sending the result directly from the function
    @GetMapping
    public ResponseEntity<Collection<Club>> findAllClubs() {
        Collection<Club> allClubs = clubService.findAllClubs();
        return ResponseEntity.ok(allClubs);
    }

    @PostMapping
    public ResponseEntity<Club> saveClub(@RequestBody Club club) {
        return ResponseEntity.ok(clubService.saveClub(club));
    }

    //Creation of Response file
    //Localization?
    @DeleteMapping("/{clubId}")
    public ResponseEntity<Object> deleteClub(@PathVariable UUID clubId) {
        clubService.deleteClub(clubId);
        return new ResponseEntity<>("Club eliminado correctamente", HttpStatus.OK);
        /* 
        try {
            service.delete(id);
            return Response.ok( "");
        } catch (BusinessException anError) {
            return Response.conflict(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return Response.conflict("");
        }
         */
    }
}
