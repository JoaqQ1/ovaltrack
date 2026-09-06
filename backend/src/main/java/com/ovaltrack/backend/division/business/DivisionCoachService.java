package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.repository.DivisionCoachRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionCoachService {

    @Autowired
    private DivisionCoachRepository divisionCoachRepository;

	public Collection<DivisionCoach> findDivisionCoachesByDivisionId(UUID divisionId) {
		return divisionCoachRepository.findDivisionCoachesByDivisionId(divisionId);
	}

    public DivisionCoach findDivisionCoachById(UUID divisionCoachId) {
        return divisionCoachRepository.findById(divisionCoachId).orElse(null);
    }

    @Transactional
	public DivisionCoach saveDivisionCoach(Division aDivision, DivisionCoach divisionCoach) {
        divisionCoach.setDivision(aDivision);
		return divisionCoachRepository.save(divisionCoach);
	}

    @Transactional
    public void deleteDivisionCoach(UUID divisionCoachId) {
        divisionCoachRepository.deleteById(divisionCoachId);
    }
}