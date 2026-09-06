package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.repository.DivisionCoachRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionCoachService {

    @Autowired
    private DivisionCoachRepository divisionCoachRepository;

	public Collection<DivisionCoach> findDivisionCoachesByClubIdAndDivisionId(UUID clubId, UUID divisionId) {
		return divisionCoachRepository.findDivisionCoachesByClubIdAndDivisionId(clubId, divisionId);
	}
    public DivisionCoach findDivisionCoachByIdAndDivisionId(UUID divisionCoachId, UUID divisionId) {
        return divisionCoachRepository.findDivisionCoachByIdAndDivisionId(divisionCoachId, divisionId);
    }

    @Transactional
	public DivisionCoach saveDivisionCoach(Division aDivision, DivisionCoach divisionCoach) {
        divisionCoach.setDivision(aDivision);
		return divisionCoachRepository.save(divisionCoach);
	}

    //TODO: Don't actually delete it, just change end timestamp and soft delete it
    @Transactional
    public void deleteDivisionCoach(Club aClub, Division aDivision, UUID divisionCoachId) {
		DivisionCoach aDivisionCoach = this.findDivisionCoachByIdAndDivisionId(divisionCoachId, aDivision.getId());

        if (aDivisionCoach == null) {
            throw new BusinessException("No se puede desasociar un entrenador que no existe");
        }

		if (!aClub.equals(aDivisionCoach.getDivision().getClub())) {
			throw new BusinessException("Club no coincide con club del entrenador");
		}

        divisionCoachRepository.deleteById(divisionCoachId);
    }

}