package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.repository.DivisionRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionService {

	@Autowired
	private DivisionRepository divisionRepository;

	public Collection<Division> findAllDivisions() {
		return divisionRepository.findAll();
	}

	public Division findDivisionById(UUID divisionId) {
		return divisionRepository.findById(divisionId).orElse(null);
	}

    //Function will assign timestamp
	@Transactional
	public Division saveDivision(Division division) {
		return divisionRepository.save(division);
	}

	@Transactional
	public void deleteDivision(UUID divisionId) {
		divisionRepository.deleteById(divisionId);
	}
}
