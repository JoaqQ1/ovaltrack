package com.ovaltrack.backend.auth.registration.service;

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;
import com.ovaltrack.backend.auth.registration.repository.RegistrationRequestRepository;
import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.club.domain.ClubStatus;
import com.ovaltrack.backend.club.domain.dto.ClubResponseDTO;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import com.ovaltrack.backend.user.domain.UserStatus;

import jakarta.transaction.Transactional;

@Service
public class AdminService {
    private final RegistrationRequestRepository repository;
    private final UserService userService;
    private final ClubService clubService;
    private final PersonService personService;

    @Autowired
    public AdminService(
            RegistrationRequestRepository repository,
            UserService userService,
            ClubService clubService,
            PersonService personService) {
        this.repository = repository;
        this.userService = userService;
        this.clubService = clubService;
        this.personService = personService;
    }

    AdminService(RegistrationRequestRepository repository) {
        this.repository = repository;
        this.userService = null;
        this.clubService = null;
        this.personService = null;
    }

    public List<RegistrationRequest> findAll() {
        return this.repository.findAll();
    }

    public List<RegistrationRequest> findAllByStatusOrderByCreatedAtAsc(RegistrationRequestStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("El estado de la solicitud no puede ser nulo");
        }
        return this.repository.findAllByStatusOrderByCreatedAtAsc(status);
    }

    public List<RegistrationRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("El id del usuario no puede ser nulo");
        }
        return this.repository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public RegistrationRequest findFirstByUserIdAndStatusOrderByCreatedAtDesc(
            UUID userId,
            RegistrationRequestStatus status) {
        if (userId == null || status == null)
            throw new IllegalArgumentException("Los campos de id o estado vinieron nulos");

        return this.repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, status).orElse(null);
    }

    @Transactional
    public RegistrationRequest saveRequest(RegistrationRequest aRegistrationRequest) {
        if (aRegistrationRequest == null)
            throw new IllegalArgumentException("La solicitud de registro vino nula");

        if (aRegistrationRequest.getUser() == null
                || aRegistrationRequest.getUser().getId() == null) {
            throw new IllegalArgumentException("La solicitud debe tener un usuario persistido");
        }
        return this.repository.save(aRegistrationRequest);
    }

    @Transactional
    public RegistrationRequest approveRequest(UUID requestId, User decidedBy) {
        RegistrationRequest request = repository.findById(requestId).orElse(null);
        if (request == null)
            throw new BusinessException("La peticion no existe");

        if (request.getRequestedRole() == UserRole.ADMIN_CLUB) {
            validateClubRequest(request);
            approvedAdmin(request);
        } else if (request.getRequestedRole() == UserRole.COACH_ANALYST) {
            validateCoachRequest(request);
            approvedCoach(request);
        }

        // request.setClub(aClub);
        request.setStatus(RegistrationRequestStatus.APPROVED);
        request.setDecisionComment(null);
        repository.save(request);
        recordDecision(request, decidedBy);
        return repository.save(request);
    }

    private void validateClubRequest(RegistrationRequest aRequest) {
        if (aRequest.getRequestedClubName() == null || aRequest.getRequestedClubName().isBlank()
                || aRequest.getRequestedClubCity() == null || aRequest.getRequestedClubCity().isBlank()) {
            throw new BusinessException("La solicitud no contiene el nombre y la región del club");
        }
    }

    private void approvedAdmin(RegistrationRequest request) {
        User adminClub = request.getUser();
        ClubResponseDTO clubResponse = clubService.saveClub(request.toClubCreationDTO());
        Club aClub = clubService.findClubEntityById(clubResponse.id());
        Person aPerson = personService.createPerson(request.toPersonCreationDTO(), aClub);

        adminClub.setPerson(aPerson);
        adminClub.setRole(UserRole.ADMIN_CLUB);
        adminClub.setAccountStatus(UserStatus.ACTIVE);
        adminClub.setActive(true);
        userService.saveUser(adminClub);
    }

    private void validateCoachRequest(RegistrationRequest request) {

        if (request.getRequestedRole() == UserRole.COACH_ANALYST && request.getClubId() == null)
            throw new BusinessException("Debe seleccionar un club para solicitar acceso como entrenador");

        ClubResponseDTO club = clubService.findClubById(request.getClubId());

        if (club == null)
            throw new BusinessException("El club seleccionado no existe");

        if (club.status() != ClubStatus.ACTIVE)
            throw new BusinessException("El club seleccionado no está activo");
    }

    private void approvedCoach(RegistrationRequest request) {
        User coach = request.getUser();
        Club aClub = clubService.findClubEntityById(request.getClubId());
        if (aClub == null)
            throw new BusinessException("El club asociado no existe");
        Person aPerson = personService.createPerson(request.toPersonCreationDTO(), aClub);

        coach.setPerson(aPerson);
        coach.setRole(UserRole.COACH_ANALYST);
        coach.setAccountStatus(UserStatus.ACTIVE);
        coach.setActive(true);
        userService.saveUser(coach);
    }

    @Transactional
    public void rejectClubRequest(UUID requestId, User decidedBy, String reason) {
        RegistrationRequest request = findOpenClubRequest(requestId);
        request.setStatus(RegistrationRequestStatus.REJECTED);
        request.getUser().setAccountStatus(UserStatus.REJECTED);
        request.getUser().setActive(false);
        userService.saveUser(request.getUser());
        request.setDecisionComment(requireComment(reason, "El motivo de rechazo es obligatorio"));
        recordDecision(request, decidedBy);
    }

    private RegistrationRequest findOpenClubRequest(UUID requestId) {
        if (requestId == null) {
            throw new IllegalArgumentException("El id de la solicitud es obligatorio");
        }

        RegistrationRequest request = repository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud de registro no encontrada"));
        if (request.getRequestedRole() != UserRole.ADMIN_CLUB) {
            throw new BusinessException("Esta operación solo aplica a solicitudes de administrador de club");
        }
        if (request.getStatus() != RegistrationRequestStatus.PENDING
                && request.getStatus() != RegistrationRequestStatus.NEEDS_INFORMATION) {
            throw new BusinessException("La solicitud ya fue resuelta");
        }
        return request;
    }

    private String requireComment(String comment, String message) {
        if (comment == null || comment.isBlank()) {
            throw new BusinessException(message);
        }
        String normalizedComment = comment.trim();
        if (normalizedComment.length() > 1000) {
            throw new BusinessException("El comentario no puede superar los 1000 caracteres");
        }
        return normalizedComment;
    }

    private void recordDecision(RegistrationRequest request, User decidedBy) {
        if (decidedBy == null || decidedBy.getId() == null) {
            throw new IllegalArgumentException("El administrador que decide debe estar persistido");
        }
        request.setDecidedBy(decidedBy);
        request.setDecidedAt(LocalDateTime.now());
        repository.save(request);
    }

    public void activateAccount(UUID id){
        if(id == null) throw new BusinessException("El id de la cuenta no puede ser nulo");
        User user = userService.findUserById(id);
        if(user == null){
            throw new BusinessException("El usuario no existe");
        } 
        user.setActive(true);
        userService.saveUser(user);
    }
    public void deactivateAccount(UUID id){
        if(id == null) throw new BusinessException("El id de la cuenta no puede ser nulo");
        User user = userService.findUserById(id);
        if(user == null){
            throw new BusinessException("El usuario no existe");
        } 
        user.deactivate();
        userService.saveUser(user);
    }
}
