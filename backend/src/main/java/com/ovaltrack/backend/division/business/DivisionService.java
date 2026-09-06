package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
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

	public Division findDivisionByIdAndClubId(UUID divisionId, UUID clubId) {
		return divisionRepository.findDivisionByIdAndClubId(divisionId, clubId);
	}

	// Function will assign timestamp
	@Transactional
	public Division saveDivision(Club aClub, Division aDivision) {
		aDivision.setClub(aClub);
		return divisionRepository.save(aDivision);
	}

	@Transactional
	public void deleteDivision(Club aClub, UUID divisionId) {
		Division aDivision = this.findDivisionByIdAndClubId(divisionId, aClub.getId());
		if (aDivision == null) {
			throw new BusinessException("No se puede eliminar una division que no esta asociada al club");
		}
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

	public DivisionPlayer findDivisionPlayerByIdAndDivisionId(UUID divisionPlayerId, UUID divisionId) {
		return divisionPlayerService.findDivisionPlayerByIdAndDivisionId(divisionPlayerId, divisionId);
	}

	@Transactional
	public DivisionPlayer saveDivisionPlayer(Division aDivision, DivisionPlayer divisionPlayer) {
		return divisionPlayerService.saveDivisionPlayer(aDivision, divisionPlayer);
	}

	@Transactional
	public void deleteDivisionPlayer(Club aClub, Division aDivision, UUID divisionPlayerId) {
		divisionPlayerService.deleteDivisionPlayer(aClub, aDivision, divisionPlayerId);
	}

	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION_COACH FUNCTIONS
	 * /////////////////////////////////////////////////////////////////////////////
	 */

	public Collection<DivisionCoach> findDivisionCoachesByClubIdAndDivisionId(UUID clubId, UUID divisionId) {
		return divisionCoachService.findDivisionCoachesByClubIdAndDivisionId(clubId, divisionId);
	}

	public DivisionCoach findDivisionCoachByIdAndDivisionId(UUID coachId, UUID divisionId) {
		return divisionCoachService.findDivisionCoachByIdAndDivisionId(coachId, divisionId);
	}

	@Transactional
	public DivisionCoach saveDivisionCoach(Division aDivision, DivisionCoach divisionCoach) {
		return divisionCoachService.saveDivisionCoach(aDivision, divisionCoach);
	}

	@Transactional
	public void deleteDivisionCoach(Club aClub, Division aDivision, UUID divisionCoachId) {
		divisionCoachService.deleteDivisionCoach(aClub, aDivision, divisionCoachId);
	}

}