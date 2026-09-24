package com.ovaltrack.backend.division.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisiondto.DivisionUpdateDTO;
import com.ovaltrack.backend.division.repository.DivisionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DivisionService {

	private final DivisionRepository divisionRepository;
	private final ClubService clubService;
	private final DivisionSecurityValidator divisionSecurityValidator;

	public Collection<DivisionResponseDTO> findAllDivisionsByClubId(UUID clubId) {
		return findAllDivisionsByClubId(clubId, null);
	}

	public Collection<DivisionResponseDTO> findAllDivisionsByClubId(UUID clubId, Authentication authentication) {
		if (authentication != null) {
			divisionSecurityValidator.validateCanAccessClubDivisions(clubId, authentication);
		}
		if (clubService.findClubById(clubId) == null) {
			throw new BusinessException("Club no encontrado");
		}
		return divisionRepository.findAllDivisionsByClubId(clubId).stream()
				.map(DivisionDTOMapper::toResponseDTO)
				.toList();
	}

	public DivisionResponseDTO findDivisionById(UUID divisionId) {
		return findDivisionById(divisionId, null);
	}

	public DivisionResponseDTO findDivisionById(UUID divisionId, Authentication authentication) {
		Division result = divisionRepository.findById(divisionId).orElse(null);
		if (result != null && authentication != null) {
			divisionSecurityValidator.validateCanAccessDivision(result, authentication);
		}
		return DivisionDTOMapper.toResponseDTO(result);
	}

	public Division findDivisionEntityById(UUID divisionId) {
		return divisionRepository.findById(divisionId).orElse(null);
	}

	@Transactional
	public DivisionResponseDTO saveDivision(DivisionCreationDTO aDivisionRequest) {
		return saveDivision(aDivisionRequest, null);
	}

	@Transactional
	public DivisionResponseDTO saveDivision(DivisionCreationDTO aDivisionRequest, Authentication authentication) {
		if (authentication != null) {
			divisionSecurityValidator.validateCanCreateDivision(aDivisionRequest.clubId(), authentication);
		}

		Club aClub = null;
		if (aDivisionRequest.clubId() != null) {
			aClub = clubService.findClubEntityById(aDivisionRequest.clubId());
		} else if (authentication != null) {
			aClub = clubService.findClubEntityForAuthenticatedUser(authentication);
		}

		if (aClub == null) {
			throw new BusinessException("No se puede asignar una division a un club que no existe");
		}

		if (divisionRepository.findByNameAndClubId(aDivisionRequest.name().toUpperCase(), aClub.getId()) != null) {
			throw new BusinessException("No se puede crear una division que ya esta activa");
		}

		Division aDivision = buildDivision(aDivisionRequest, aClub);
		return DivisionDTOMapper.toResponseDTO(divisionRepository.save(aDivision));
	}

	private Division buildDivision(DivisionCreationDTO request, Club club) {
		return Division.builder()
				.name(request.name())
				.ageCategory(request.ageCategory())
				.club(club)
				.gender(request.gender())
				.active(true)
				.build();
	}

	@Transactional
	public void deleteDivision(UUID divisionId) {
		deleteDivision(divisionId, null);
	}

	@Transactional
	public void deleteDivision(UUID divisionId, Authentication authentication) {
		Division aDivision = findDivisionEntityById(divisionId);
		if (aDivision == null) {
			throw new BusinessException("No se puede eliminar una division que no existe");
		}

		if (authentication != null) {
			divisionSecurityValidator.validateCanManageDivision(aDivision, authentication);
		}

		aDivision.setActive(false);
		divisionRepository.save(aDivision);
	}

	@Transactional
	public DivisionResponseDTO updateDivision(UUID divisionId, DivisionUpdateDTO request) {
		return updateDivision(divisionId, request, null);
	}

	@Transactional
	public DivisionResponseDTO updateDivision(UUID divisionId, DivisionUpdateDTO request,
			Authentication authentication) {
		Division aDivision = divisionRepository.findById(divisionId).orElse(null);
		if (aDivision == null) {
			throw new BusinessException("Division no encontrada");
		}

		if (authentication != null) {
			divisionSecurityValidator.validateCanManageDivision(aDivision, authentication);
		}

		aDivision.setName(request.name());
		aDivision.setAgeCategory(request.ageCategory());
		aDivision.setGender(request.gender());

		return DivisionDTOMapper.toResponseDTO(divisionRepository.save(aDivision));
	}

}
