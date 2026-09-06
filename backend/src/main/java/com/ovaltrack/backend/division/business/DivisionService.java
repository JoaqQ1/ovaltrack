package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.repository.DivisionRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionService {

	@Autowired
	private DivisionRepository divisionRepository;

	@Autowired
	private DivisionPlayerService divisionPlayerService;

	@Autowired
	private DivisionCoachService divisionCoachService;

	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION FUNCTIONS
	 * /////////////////////////////////////////////////////////////////////////////
	 */
	public Collection<Division> findAllDivisionsByClubId(UUID clubId) {
		return divisionRepository.findAllDivisionsByClubId(clubId);
	}

	public Division findDivisionById(UUID divisionId) {
		return divisionRepository.findById(divisionId).orElse(null);
	}

	// Function will assign timestamp
	@Transactional
	public Division saveDivision(Club aClub, Division aDivision) {
		aDivision.setClub(aClub);
		return divisionRepository.save(aDivision);
	}

	@Transactional
	public void deleteDivision(UUID divisionId) {
		divisionRepository.deleteById(divisionId);
	}

	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION_PLAYER FUNCTIONS
	 * /////////////////////////////////////////////////////////////////////////////
	 */

	public Collection<DivisionPlayer> findDivisionPlayersByDivision(UUID divisionId) {
		return divisionPlayerService.findDivisionPlayersByDivision(divisionId);
	}

	public DivisionPlayer findDivisionPlayerById(UUID divisionPlayerId) {
		return divisionPlayerService.findDivisionPlayerById(divisionPlayerId);
	}

	@Transactional
	public DivisionPlayer saveDivisionPlayer(Division aDivision, DivisionPlayer divisionPlayer) {
		return divisionPlayerService.saveDivisionPlayer(aDivision, divisionPlayer);
	}

	@Transactional
	public void deleteDivisionPlayer(UUID divisionPlayerId) {
		divisionPlayerService.deleteDivisionPlayer(divisionPlayerId);
	}

	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION_COACH FUNCTIONS
	 * /////////////////////////////////////////////////////////////////////////////
	 */

	public Collection<DivisionCoach> findDivisionCoachesByDivisionId(UUID divisionId) {
		return divisionCoachService.findDivisionCoachesByDivisionId(divisionId);
	}

	public DivisionCoach findDivisionCoachById(UUID coachId) {
		return divisionCoachService.findDivisionCoachById(coachId);
	}

	@Transactional
	public DivisionCoach saveDivisionCoach(Division aDivision, DivisionCoach divisionCoach) {
		return divisionCoachService.saveDivisionCoach(aDivision, divisionCoach);
	}

	@Transactional
	public void deleteDivisionCoach(UUID divisionCoachId) {
		divisionCoachService.deleteDivisionCoach(divisionCoachId);
	}

}