package com.ovaltrack.backend.match.controller;

import com.ovaltrack.backend.match.business.OpponentService;
import com.ovaltrack.backend.match.domain.Opponent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("opponents")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class OpponentController {

    private final OpponentService opponentService;

    @GetMapping
    public ResponseEntity<List<Opponent>> getAll() {
        return ResponseEntity.ok(opponentService.getAllOpponents());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN_CLUB') or hasRole('ADMIN_OVALTRACK')")
    public ResponseEntity<Opponent> create(@RequestBody Opponent opponent) {
        Opponent created = opponentService.createOpponent(opponent);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}