package com.ovaltrack.backend.match.business;

import com.ovaltrack.backend.match.domain.Opponent;
import com.ovaltrack.backend.match.repository.OpponentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OpponentService {

    private final OpponentRepository opponentRepository;

    public List<Opponent> getAllOpponents() {
        return opponentRepository.findAll();
    }

    public Opponent createOpponent(Opponent opponent) {
        // Acá podrías agregar validaciones extra si quisieras
        return opponentRepository.save(opponent);
    }
}