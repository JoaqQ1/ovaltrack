package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.domain.dto.DivisionCreationDTO;
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.DivisionResponseDTO;
import com.ovaltrack.backend.division.repository.DivisionRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionService {

	@Autowired
	private DivisionRepository divisionRepository;

	@Autowired 
	private ClubService clubService;

	@Autowired
	private DivisionPlayerService divisionPlayerService;

	@Autowired
	private DivisionCoachService divisionCoachService;


//TODO: Adapt division services to use DTOs instead of JPA entities. Adapt endpoints


	/*
	 * /////////////////////////////////////////////////////////////////////////////
	 * DIVISION FUNCTIONS
	 * /////////////////////////////////////////////////////////////////////////////
	 */

	public Collection<DivisionResponseDTO> findAllDivisionsByClubId(UUID clubId) {
		if (clubService.findClubById(clubId) == null) {
			throw new EntityNotFoundException("Club no encontrado");
        }
		return divisionRepository.findAllDivisionsByClubId(clubId).stream()
				.map(DivisionDTOMapper::toResponseDTO)
				.toList();
	}

	public DivisionResponseDTO findDivisionById(UUID divisionId) {
		Division result = divisionRepository.findById(divisionId).orElse(null);
		return DivisionDTOMapper.toResponseDTO(result);
	}

	@Transactional
	public DivisionResponseDTO saveDivision(UUID clubId, DivisionCreationDTO aDivision) {
		if (aDivision.divisionId() == null) {
			Club aClub = clubService.findClubById(clubId);
			if (aClub == null) {
				throw new EntityNotFoundException("Club no encontrado");
			}
			aDivision.setClub(aClub);
		}
/* 
		if (aDivision.getId() != null) {
			if (findDivisionByIdAndClubId(aDivision.getId(), aClub.getId()) != null) {
				aDivision.setActive(true);
			}
			if (divisionRepository.findById(aDivision.getId()) != null) {
				throw new BusinessException("No se puede asignar una division de otro club");
			}
		}
 */
		return divisionRepository.save(aDivision);
	}


	@Transactional
	public Division updateDivision(UUID clubId, Division aDivision) {
		if (aDivision.getId() == null) {
			Club aClub = clubService.findClubById(clubId);
			if (aClub == null) {
				throw new EntityNotFoundException("Club no encontrado");
			}
			aDivision.setClub(aClub);
		}
/* 
		if (aDivision.getId() != null) {
			if (findDivisionByIdAndClubId(aDivision.getId(), aClub.getId()) != null) {
				aDivision.setActive(true);
			}
			if (divisionRepository.findById(aDivision.getId()) != null) {
				throw new BusinessException("No se puede asignar una division de otro club");
			}
		}
 */
		return divisionRepository.save(aDivision);
	}



	@Transactional
	public void deleteDivision(Club aClub, UUID divisionId) {
		Division aDivision = this.findDivisionByIdAndClubId(divisionId, aClub.getId());
		if (aDivision == null) {
			throw new BusinessException("No se puede eliminar una division que no esta asociada al club");
		}

		aDivision.setActive(false);
		divisionRepository.save(aDivision);
		//TODO: Discuss whether to allow disabling without considering player association. In which case this should disable every DivisionPlayer and DivisionCoach associated
		//divisionRepository.deleteById(divisionId);
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