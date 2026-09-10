package com.ovaltrack.backend.division.business;

import java.time.LocalDate;
import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerUpdateDTO;
import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;

import jakarta.transaction.Transactional;

@Service
public class DivisionPlayerService {

    @Autowired
    private DivisionPlayerRepository divisionPlayerRepository;

    @Autowired
    private DivisionService divisionService;

    @Autowired
    private PersonService personService;

    public Collection<DivisionPlayerResponseDTO> findDivisionPlayersByDivision(UUID divisionId) {
        if (divisionService.findDivisionById(divisionId) == null) {
            throw new BusinessException("Division no encontrada");
        }
        return divisionPlayerRepository.findDivisionPlayersByDivision(divisionId).stream()
                .map(DivisionDTOMapper::toResponseDTO).toList();
    }

    public DivisionPlayerResponseDTO findDivisionPlayerById(UUID divisionPlayerId) {
        DivisionPlayer result = divisionPlayerRepository.findById(divisionPlayerId).orElse(null);
        return DivisionDTOMapper.toResponseDTO(result);
    }

    public DivisionPlayer findDivisionPlayerEntityById(UUID divisionPlayerId) {
        return divisionPlayerRepository.findById(divisionPlayerId).orElse(null);
    }

    @Transactional
    public DivisionPlayerResponseDTO saveDivisionPlayer(DivisionPlayerCreationDTO divisionPlayerRequest) {
        Person aPerson = personService.findPersonEntityById(divisionPlayerRequest.personId());
        if (aPerson == null) {
            throw new BusinessException("La persona no existe");
        }
        Division aDivision = divisionService.findDivisionEntityById(divisionPlayerRequest.divisionId());
        if (aDivision == null) {
            throw new BusinessException("No se puede asignar un jugador a una division que no existe");
        }
        if (divisionPlayerRepository.existsActiveAssociation(aDivision.getId(), aPerson.getId())) {
            throw new BusinessException("La persona ya esta asociada como jugador en esta division");
        }

        DivisionPlayer aDivisionPlayer = new DivisionPlayer();
        aDivisionPlayer.setDivision(aDivision);
        aDivisionPlayer.setPerson(aPerson);
        aDivisionPlayer.setJerseyNumber(divisionPlayerRequest.jerseyNumber());
        aDivisionPlayer.setPosition(divisionPlayerRequest.position());
        aDivisionPlayer.setStartDate(LocalDate.now());
        aDivisionPlayer.setEndDate(null);

        aDivisionPlayer = divisionPlayerRepository.save(aDivisionPlayer);
        return DivisionDTOMapper.toResponseDTO(aDivisionPlayer);
    }

    @Transactional
    public void deleteDivisionPlayer(UUID divisionPlayerId) {
        DivisionPlayer aDivisionPlayer = this.findDivisionPlayerEntityById(divisionPlayerId);
        if (aDivisionPlayer == null) {
            throw new BusinessException("No se puede desasociar un jugador que no existe");
        }

        if (aDivisionPlayer.getEndDate() != null) {
            throw new BusinessException("No se puede desasociar un jugador que ya no esta asociado a la division");
        }

        aDivisionPlayer.setEndDate(LocalDate.now());
        divisionPlayerRepository.save(aDivisionPlayer);
    }

    @Transactional
    public DivisionPlayerResponseDTO updateDivisionPlayer(UUID divisionPlayerId, DivisionPlayerUpdateDTO request) {
        DivisionPlayer divisionPlayer = findDivisionPlayerEntityById(divisionPlayerId);
        if (divisionPlayer == null) {
            throw new BusinessException("Jugador no encontrado en la division");
        }

        divisionPlayer.setJerseyNumber(request.jerseyNumber());
        divisionPlayer.setPosition(request.position());

        return DivisionDTOMapper.toResponseDTO(divisionPlayerRepository.save(divisionPlayer));
    }

}