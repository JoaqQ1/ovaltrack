package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
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

    public DivisionPlayer findDivisionPlayerByIdAndDivisionId(UUID divisionPlayerId, UUID divisionId) {
        return divisionPlayerRepository.findDivisionPlayerByIdAndDivisionId(divisionPlayerId, divisionId);
    }

    @Transactional
	public DivisionPlayer saveDivisionPlayer(Division aDivision, DivisionPlayer divisionPlayer) {
        divisionPlayer.setDivision(aDivision);
		return divisionPlayerRepository.save(divisionPlayer);
	}

    @Transactional
    public void deleteDivisionPlayer(Club aClub, Division aDivision, UUID divisionPlayerId) {
        DivisionPlayer aDivisionPlayer = this.findDivisionPlayerByIdAndDivisionId(divisionPlayerId, aDivision.getId());
        if (aDivisionPlayer == null) {
            throw new BusinessException("No se puede desasociar un jugador que no existe");
        }

		if (!aClub.equals(aDivisionPlayer.getDivision().getClub())) {
			throw new BusinessException("Club no coincide con club del jugador");
		}

        divisionPlayerRepository.deleteById(divisionPlayerId);
    }

}