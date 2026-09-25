package com.ovaltrack.backend.division.business;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerUpdateDTO;
import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;
import com.ovaltrack.backend.match.domain.dto.AvailablePlayerDTO;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.person.domain.dto.PersonCreationDTO;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DivisionPlayerService {

    private final DivisionPlayerRepository divisionPlayerRepository;
    private final DivisionSecurityValidator divisionSecurityValidator;
    private final DivisionService divisionService;
    private final PersonService personService;

    public Collection<DivisionPlayerResponseDTO> findActiveDivisionPlayersByDivision(UUID divisionId) {
        return findActiveDivisionPlayersByDivision(divisionId, null);
    }

    public Collection<DivisionPlayerResponseDTO> findActiveDivisionPlayersByDivision(UUID divisionId, Authentication authentication) {
        Division division = divisionService.findDivisionEntityById(divisionId);
        if (division == null) {
            throw new BusinessException("Division no encontrada");
        }
        if (authentication != null) {
            divisionSecurityValidator.validateCanAccessDivision(division, authentication);
        }
        return divisionPlayerRepository.findActiveDivisionPlayersByDivision(divisionId).stream()
                .map(DivisionDTOMapper::toResponseDTO).toList();
    }

    public Collection<DivisionPlayerResponseDTO> findDivisionPlayersByDivision(UUID divisionId) {
        return findActiveDivisionPlayersByDivision(divisionId, null);
    }

    public Collection<DivisionPlayerResponseDTO> findDivisionPlayersByDivision(UUID divisionId, Authentication authentication) {
        return findActiveDivisionPlayersByDivision(divisionId, authentication);
    }

    public Collection<DivisionPlayerResponseDTO> findDivisionPlayersByDivisionIdAndPersonId(UUID divisionId, UUID personId) {
        return findDivisionPlayersByDivisionIdAndPersonId(divisionId, personId, null);
    }

    public Collection<DivisionPlayerResponseDTO> findDivisionPlayersByDivisionIdAndPersonId(UUID divisionId, UUID personId, Authentication authentication) {
        Division division = divisionService.findDivisionEntityById(divisionId);
        if (division == null) {
            throw new BusinessException("Division no encontrada");
        }
        if (authentication != null) {
            divisionSecurityValidator.validateCanAccessDivision(division, authentication);
        }
        if (personService.findPersonEntityById(personId) == null) {
            throw new BusinessException("Persona no encontrada");
        }
        return divisionPlayerRepository.findDivisionPlayersByDivisionIdAndPersonId(divisionId, personId).stream()
                .map(DivisionDTOMapper::toResponseDTO).toList();
    }

    public DivisionPlayerResponseDTO findDivisionPlayerById(UUID divisionPlayerId) {
        return findDivisionPlayerById(divisionPlayerId, null);
    }

    public DivisionPlayerResponseDTO findDivisionPlayerById(UUID divisionPlayerId, Authentication authentication) {
        DivisionPlayer result = divisionPlayerRepository.findById(divisionPlayerId).orElse(null);
        if (result != null && authentication != null) {
            divisionSecurityValidator.validateCanAccessDivision(result.getDivision(), authentication);
        }
        return DivisionDTOMapper.toResponseDTO(result);
    }

    public List<AvailablePlayerDTO> findAvailablePlayersByDivisionId(UUID divisionId) {
        return findAvailablePlayersByDivisionId(divisionId, null);
    }

    public List<AvailablePlayerDTO> findAvailablePlayersByDivisionId(UUID divisionId, Authentication authentication) {
        Division division = divisionService.findDivisionEntityById(divisionId);
        if (division == null) {
            throw new BusinessException("Division no encontrada");
        }
        if (authentication != null) {
            divisionSecurityValidator.validateCanAccessDivision(division, authentication);
        }

        List<DivisionPlayer> divisionPlayers = divisionPlayerRepository.findByDivisionId(divisionId);

        return divisionPlayers.stream()
            .map((DivisionPlayer dp) -> {
                Person person = dp.getPerson();
                String fullName = person.getFirstName() + " " + person.getLastName();

                return new AvailablePlayerDTO(
                    person.getId(),
                    fullName,
                    dp.getJerseyNumber(),
                    dp.getPosition()
                );
            })
            .toList();
    }

    public DivisionPlayer findDivisionPlayerEntityById(UUID divisionPlayerId) {
        return divisionPlayerRepository.findById(divisionPlayerId).orElse(null);
    }

    @Transactional
    public DivisionPlayerResponseDTO saveDivisionPlayer(DivisionPlayerCreationDTO divisionPlayerRequest) {
        return saveDivisionPlayer(divisionPlayerRequest, null);
    }

    @Transactional
    public DivisionPlayerResponseDTO saveDivisionPlayer(DivisionPlayerCreationDTO divisionPlayerRequest, Authentication authentication) {
        Division aDivision = divisionService.findDivisionEntityById(divisionPlayerRequest.divisionId());
        if (aDivision == null) {
            throw new BusinessException("No se puede asignar un jugador a una division que no existe");
        }

        if (authentication != null) {
            divisionSecurityValidator.validateCanManageDivisionPlayers(aDivision, authentication);
        }

        Person aPerson;
        if (divisionPlayerRequest.personId() != null) {
            aPerson = personService.findPersonEntityById(divisionPlayerRequest.personId());
            if (aPerson == null) {
                throw new BusinessException("La persona no existe");
            }
        } else {
            PersonCreationDTO personDto = new PersonCreationDTO(
                    divisionPlayerRequest.firstName(),
                    divisionPlayerRequest.lastName(),
                    divisionPlayerRequest.birthDate(),
                    divisionPlayerRequest.contactEmail(),
                    divisionPlayerRequest.contactPhone()
            );
            aPerson = personService.createPerson(personDto, aDivision.getClub());
        }

        if (divisionPlayerRepository.existsActiveAssociation(aDivision.getId(), aPerson.getId())) {
            throw new BusinessException("La persona ya esta asociada como jugador en esta division");
        }

        DivisionPlayer aDivisionPlayer = buildDivisionPlayer(aDivision, aPerson, divisionPlayerRequest);

        aDivisionPlayer = divisionPlayerRepository.save(aDivisionPlayer);
        return DivisionDTOMapper.toResponseDTO(aDivisionPlayer);
    }

    private DivisionPlayer buildDivisionPlayer(Division division, Person person, DivisionPlayerCreationDTO request) {
        return DivisionPlayer.builder()
                .division(division)
                .person(person)
                .jerseyNumber(request.jerseyNumber())
                .position(request.position())
                .startDate(LocalDate.now())
                .endDate(null)
                .build();
    }

    @Transactional
    public DivisionPlayerResponseDTO deleteDivisionPlayer(UUID divisionPlayerId) {
        return deleteDivisionPlayer(divisionPlayerId, null);
    }

    @Transactional
    public DivisionPlayerResponseDTO deleteDivisionPlayer(UUID divisionPlayerId, Authentication authentication) {
        DivisionPlayer aDivisionPlayer = this.findDivisionPlayerEntityById(divisionPlayerId);
        if (aDivisionPlayer == null) {
            throw new BusinessException("No se puede desasociar un jugador que no existe");
        }

        if (authentication != null) {
            divisionSecurityValidator.validateCanManageDivisionPlayers(aDivisionPlayer.getDivision(), authentication);
        }

        if (aDivisionPlayer.getEndDate() != null) {
            throw new BusinessException("No se puede desasociar un jugador que ya no esta asociado a la division");
        }

        aDivisionPlayer.setEndDate(LocalDate.now());
        divisionPlayerRepository.save(aDivisionPlayer);
        
        return DivisionDTOMapper.toResponseDTO(aDivisionPlayer);
    }

    @Transactional
    public DivisionPlayerResponseDTO updateDivisionPlayer(UUID divisionPlayerId, DivisionPlayerUpdateDTO request) {
        return updateDivisionPlayer(divisionPlayerId, request, null);
    }

    @Transactional
    public DivisionPlayerResponseDTO updateDivisionPlayer(UUID divisionPlayerId, DivisionPlayerUpdateDTO request, Authentication authentication) {
        DivisionPlayer divisionPlayer = findDivisionPlayerEntityById(divisionPlayerId);
        if (divisionPlayer == null) {
            throw new BusinessException("Jugador no encontrado en la division");
        }

        if (authentication != null) {
            divisionSecurityValidator.validateCanManageDivisionPlayers(divisionPlayer.getDivision(), authentication);
        }

        divisionPlayer.setJerseyNumber(request.jerseyNumber());
        divisionPlayer.setPosition(request.position());

        return DivisionDTOMapper.toResponseDTO(divisionPlayerRepository.save(divisionPlayer));
    }
}
