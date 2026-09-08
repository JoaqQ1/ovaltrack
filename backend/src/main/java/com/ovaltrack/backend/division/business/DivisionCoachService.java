package com.ovaltrack.backend.division.business;

import java.time.LocalDate;
import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionCoach;
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisioncoachdto.DivisionCoachResponseDTO;
import com.ovaltrack.backend.division.repository.DivisionCoachRepository;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;

import jakarta.transaction.Transactional;

@Service
public class DivisionCoachService {

    @Autowired
    private DivisionCoachRepository divisionCoachRepository;

    @Autowired 
    private DivisionService divisionService;

    @Autowired 
    private UserService userService;

	public Collection<DivisionCoachResponseDTO> findDivisionCoachesByDivisionId(UUID divisionId) {
		if (divisionService.findDivisionById(divisionId) == null) {
			throw new BusinessException("Division no encontrada");
        }
		return divisionCoachRepository.findDivisionCoachesByDivisionId(divisionId).stream().map(DivisionDTOMapper::toResponseDTO).toList();
	}
    public DivisionCoachResponseDTO findDivisionCoachById(UUID divisionCoachId) {
        DivisionCoach result = divisionCoachRepository.findById(divisionCoachId).orElse(null);
        return DivisionDTOMapper.toResponseDTO(result);
    }

    public DivisionCoach findDivisionCoachEntityById(UUID divisionCoachId) {
        return divisionCoachRepository.findById(divisionCoachId).orElse(null);
    }

    @Transactional
	public DivisionCoachResponseDTO saveDivisionCoach(DivisionCoachCreationDTO divisionCoachRequest) {
        User anUser = userService.findUserById(divisionCoachRequest.userId());
        if (anUser == null ){
            throw new BusinessException("El usuario no existe");
        }
        Division aDivision = divisionService.findDivisionEntityById(divisionCoachRequest.divisionId());
        if (aDivision == null ){
            throw new BusinessException("No se puede asignar un entrenador a una division que no existe");
        }
        if (divisionCoachRepository.existsActiveAssociation(
                aDivision.getId(), anUser.getId())) {
            throw new BusinessException("El usuario ya esta asociado como entrenador en esta division");
        }

        DivisionCoach aDivisionCoach = new DivisionCoach();
        aDivisionCoach.setDivision(aDivision);
        aDivisionCoach.setUser(anUser);
        aDivisionCoach.setStartDate(LocalDate.now());
        aDivisionCoach.setEndDate(null);

        aDivisionCoach = divisionCoachRepository.save(aDivisionCoach);
        return DivisionDTOMapper.toResponseDTO(aDivisionCoach);
	}

    @Transactional
    public void deleteDivisionCoach(UUID divisionCoachId) {
		DivisionCoach aDivisionCoach = this.findDivisionCoachEntityById(divisionCoachId);

        if (aDivisionCoach == null) {
            throw new BusinessException("No se puede desasociar un entrenador que no existe");
        }
        if (aDivisionCoach.getEndDate() != null) {
            throw new BusinessException("No se puede desasociar un entrenador que ya no esta asociado a la division");
        }

        aDivisionCoach.setEndDate(LocalDate.now());
        divisionCoachRepository.save(aDivisionCoach);
    }

}