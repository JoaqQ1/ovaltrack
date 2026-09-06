package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionPlayerService {

    @Autowired
    private DivisionPlayerRepository divisionPlayerRepository;

	public Collection<DivisionPlayer> findDivisionPlayersByDivision(UUID divisionId) {
		return divisionPlayerRepository.findDivisionPlayersByDivision(divisionId);
	}

    public DivisionPlayer findDivisionPlayerById(UUID divisionPlayerId) {
        return divisionPlayerRepository.findById(divisionPlayerId).orElse(null);
    }

    @Transactional
	public DivisionPlayer saveDivisionPlayer(Division aDivision, DivisionPlayer divisionPlayer) {
        divisionPlayer.setDivision(aDivision);
		return divisionPlayerRepository.save(divisionPlayer);
	}

    @Transactional
    public void deleteDivisionPlayer(UUID divisionPlayerId) {
        divisionPlayerRepository.deleteById(divisionPlayerId);
    }
}