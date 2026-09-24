package com.ovaltrack.backend.division.business;

import java.time.LocalDate;
import java.util.Collection;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.domain.dto.DivisionDTOMapper;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerCreationDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerResponseDTO;
import com.ovaltrack.backend.division.domain.dto.divisionplayerdto.DivisionPlayerUpdateDTO;
import com.ovaltrack.backend.division.repository.DivisionCoachRepository;
import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DivisionPlayerService {

    private final DivisionPlayerRepository divisionPlayerRepository;
    private final DivisionCoachRepository divisionCoachRepository;
    private final DivisionService divisionService;
    private final PersonService personService;
    private final UserService userService;
    private final ClubService clubService;

    public void validateCanManageDivisionPlayers(UUID divisionId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("No autorizado: se requiere autenticación");
        }

        String email = authentication.getName();
        User user = userService.findUserByEmail(email);
        if (user == null) {
            throw new AccessDeniedException("Acceso denegado: usuario no encontrado");
        }

        if (user.getRole() == UserRole.ADMIN_OVALTRACK) {
            return;
        }

        Division aDivision = divisionService.findDivisionEntityById(divisionId);
        if (aDivision == null) {
            throw new BusinessException("No se puede asignar un jugador a una division que no existe");
        }

        if (user.getRole() == UserRole.ADMIN_CLUB) {
            Club userClub = clubService.findClubEntityForAuthenticatedUser(authentication);
            if (userClub == null || aDivision.getClub() == null || !userClub.getId().equals(aDivision.getClub().getId())) {
                throw new AccessDeniedException("Acceso denegado: solo el administrador del club de la división puede realizar esta acción");
            }
            return;
        }

        if (user.getRole() == UserRole.COACH_ANALYST) {
            if (user.getPerson() == null || !divisionCoachRepository.existsActiveAssociation(divisionId, user.getPerson().getId())) {
                throw new AccessDeniedException("Acceso denegado: solo un entrenador asignado a esta división puede realizar esta acción");
            }
            return;
        }

        throw new AccessDeniedException("Acceso denegado: solo el administrador del club o el entrenador de la división pueden realizar esta acción");
    }

    public Collection<DivisionPlayerResponseDTO> findActiveDivisionPlayersByDivision(UUID divisionId) {
        if (divisionService.findDivisionEntityById(divisionId) == null) {
            throw new BusinessException("Division no encontrada");
        }
        return divisionPlayerRepository.findActiveDivisionPlayersByDivision(divisionId).stream()
                .map(DivisionDTOMapper::toResponseDTO).toList();
    }

    public Collection<DivisionPlayerResponseDTO> findDivisionPlayersByDivisionIdAndPersonId(UUID divisionId, UUID personId) {
        if (divisionService.findDivisionEntityById(divisionId) == null) {
            throw new BusinessException("Division no encontrada");
        }
        if (personService.findPersonEntityById(personId) == null) {
            throw new BusinessException("Persona no encontrada");
        }
        return divisionPlayerRepository.findDivisionPlayersByDivisionIdAndPersonId(divisionId, personId).stream()
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
        return saveDivisionPlayer(divisionPlayerRequest, null);
    }

    @Transactional
    public DivisionPlayerResponseDTO saveDivisionPlayer(DivisionPlayerCreationDTO divisionPlayerRequest, Authentication authentication) {
        if (authentication != null) {
            validateCanManageDivisionPlayers(divisionPlayerRequest.divisionId(), authentication);
        }

        Division aDivision = divisionService.findDivisionEntityById(divisionPlayerRequest.divisionId());
        if (aDivision == null) {
            throw new BusinessException("No se puede asignar un jugador a una division que no existe");
        }

        Person aPerson;
        if (divisionPlayerRequest.personId() != null) {
            aPerson = personService.findPersonEntityById(divisionPlayerRequest.personId());
            if (aPerson == null) {
                throw new BusinessException("La persona no existe");
            }
        } else {
            if (divisionPlayerRequest.firstName() == null || divisionPlayerRequest.firstName().trim().isEmpty() ||
                divisionPlayerRequest.lastName() == null || divisionPlayerRequest.lastName().trim().isEmpty()) {
                throw new BusinessException("Debe seleccionar una persona existente o ingresar nombre y apellido para crear una nueva");
            }

            if (divisionPlayerRequest.contactEmail() != null && !divisionPlayerRequest.contactEmail().trim().isBlank()) {
                String email = divisionPlayerRequest.contactEmail().trim();
                if (personService.existsByContactEmail(email)) {
                    throw new BusinessException("Email ya registrado");
                }
            }

            if (divisionPlayerRequest.contactPhone() != null && !divisionPlayerRequest.contactPhone().trim().isBlank()) {
                String phone = divisionPlayerRequest.contactPhone().trim();
                if (personService.existsByContactPhone(phone)) {
                    throw new BusinessException("Teléfono ya registrado");
                }
            }

            aPerson = new Person();
            aPerson.setFirstName(divisionPlayerRequest.firstName().trim());
            aPerson.setLastName(divisionPlayerRequest.lastName().trim());
            aPerson.setBirthDate(divisionPlayerRequest.birthDate());
            aPerson.setContactEmail(divisionPlayerRequest.contactEmail() != null && !divisionPlayerRequest.contactEmail().trim().isBlank() ? divisionPlayerRequest.contactEmail().trim() : null);
            aPerson.setContactPhone(divisionPlayerRequest.contactPhone() != null && !divisionPlayerRequest.contactPhone().trim().isBlank() ? divisionPlayerRequest.contactPhone().trim() : null);
            aPerson.setClub(aDivision.getClub());
            aPerson = personService.savePersonEntity(aPerson);
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
    public DivisionPlayerResponseDTO deleteDivisionPlayer(UUID divisionPlayerId) {
        DivisionPlayer aDivisionPlayer = this.findDivisionPlayerEntityById(divisionPlayerId);
        if (aDivisionPlayer == null) {
            throw new BusinessException("No se puede desasociar un jugador que no existe");
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
        DivisionPlayer divisionPlayer = findDivisionPlayerEntityById(divisionPlayerId);
        if (divisionPlayer == null) {
            throw new BusinessException("Jugador no encontrado en la division");
        }

        divisionPlayer.setJerseyNumber(request.jerseyNumber());
        divisionPlayer.setPosition(request.position());

        return DivisionDTOMapper.toResponseDTO(divisionPlayerRepository.save(divisionPlayer));
    }
}
