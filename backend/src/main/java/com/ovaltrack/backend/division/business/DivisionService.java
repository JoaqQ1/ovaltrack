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
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionUpdateDTO;
import com.ovaltrack.backend.division.repository.DivisionRepository;

import jakarta.transaction.Transactional;

@Service
public class DivisionService {

	@Autowired
	private DivisionRepository divisionRepository;

	@Autowired 
	private ClubService clubService;

	@Autowired
	private DivisionCoachService divisionCoachService;



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

	public Division findDivisionEntityById(UUID divisionId) {
		return divisionRepository.findById(divisionId).orElse(null);
	}

	@Transactional
	public DivisionResponseDTO saveDivision(DivisionCreationDTO aDivisionRequest) {
		Club aClub = clubService.findClubEntityById(aDivisionRequest.clubId());
		if (aClub == null ){
			throw new BusinessException("No se puede asignar una division a un club que no existe");
		}
		Division aDivision = new Division();
		aDivision.setName(aDivisionRequest.name());
		aDivision.setAgeCategory(aDivisionRequest.ageCategory());
		aDivision.setClub(aClub);
		aDivision.setGender(aDivisionRequest.gender());
		aDivision.setActive(true);

		return DivisionDTOMapper.toResponseDTO(divisionRepository.save(aDivision));
	}


	@Transactional
	public void deleteDivision(UUID divisionId) {
		Division aDivision = findDivisionEntityById(divisionId);
		if (aDivision == null) {
			throw new BusinessException("No se puede eliminar una division que no existe");
		}

		aDivision.setActive(false);
		divisionRepository.save(aDivision);
		//TODO: Discuss whether to allow disabling without considering player association. In which case this should disable every DivisionPlayer and DivisionCoach associated
		//divisionRepository.deleteById(divisionId);
	}

	@Transactional
	public DivisionResponseDTO updateDivision(UUID divisionId, DivisionUpdateDTO request) {

		Division aDivision = divisionRepository.findById(divisionId).orElse(null);
		if (aDivision == null){
			throw new BusinessException("Division no encontrada");
		}

		aDivision.setName(request.name());
		aDivision.setAgeCategory(request.ageCategory());
		aDivision.setGender(request.gender());

		return DivisionDTOMapper.toResponseDTO(divisionRepository.save(aDivision));
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