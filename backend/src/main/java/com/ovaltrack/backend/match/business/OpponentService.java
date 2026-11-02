package com.ovaltrack.backend.match.business;

import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.match.domain.Opponent;
import com.ovaltrack.backend.match.repository.OpponentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OpponentService {

    private final OpponentRepository opponentRepository;

    public List<Opponent> getAllOpponents() {
        return opponentRepository.findAll();
    }

    public Opponent createOpponent(Opponent opponent) {
        return opponentRepository.save(opponent);
    }

    public Opponent updateOpponent(UUID id, Opponent updateData){
        Opponent existing = opponentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Oponente no encontrado"));
        
        existing.setName(updateData.getName());
        existing.setAlias(updateData.getAlias());
        existing.setCity(updateData.getCity());
        
        return opponentRepository.save(existing);
    }

    public void deleteOpponent(UUID id){
        opponentRepository.deleteById(id);
    }
}