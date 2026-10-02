package com.ovaltrack.backend.auth.registration.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;
import com.ovaltrack.backend.auth.registration.domain.dto.PendingRegistrationRequestDTO;
import com.ovaltrack.backend.auth.registration.repository.RegistrationRequestRepository;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.person.domain.Person;

import jakarta.transaction.Transactional;

@Service
public class RegistrationRequestService {
    private RegistrationRequestRepository repository;

    public RegistrationRequestService(RegistrationRequestRepository repository) {
        this.repository = repository;
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

    @Transactional
    public List<PendingRegistrationRequestDTO> findOpenRequests() {
        return this.repository.findAllByStatusInOrderByCreatedAtAsc(List.of(
                RegistrationRequestStatus.PENDING,
                RegistrationRequestStatus.NEEDS_INFORMATION))
                .stream()
                .map(this::toPendingRequestDTO)
                .toList();
    }

    private PendingRegistrationRequestDTO toPendingRequestDTO(RegistrationRequest request) {
        Person person = request.getUser().getPerson();
        return new PendingRegistrationRequestDTO(
                request.getId(),
                request.getUser().getId(),
                request.getUser().getLoginEmail(),
                person == null ? null : person.getFirstName(),
                person == null ? null : person.getLastName(),
                request.getRequestedRole(),
                request.getClub() == null ? null : request.getClub().getId(),
                request.getClub() == null ? null : request.getClub().getName(),
                request.getStatus(),
                request.getCreatedAt());
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

    public RegistrationRequest createRequest(RegistrationRequest aRegistrationRequest) {
        if (aRegistrationRequest == null)
            throw new IllegalArgumentException("La solicitud de registro vino nula");
        
        if (aRegistrationRequest.getUser() == null
                || aRegistrationRequest.getUser().getId() == null) {
            throw new IllegalArgumentException("La solicitud debe tener un usuario persistido");
        }

        UUID userId = aRegistrationRequest.getUser().getId();
        boolean hasOpenRequest = findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                userId, RegistrationRequestStatus.PENDING) != null
                || findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                        userId, RegistrationRequestStatus.NEEDS_INFORMATION) != null;
        if (hasOpenRequest)
            throw new BusinessException("El usuario ya tiene una solicitud de registro abierta");

        return this.repository.save(aRegistrationRequest);
    }
}
