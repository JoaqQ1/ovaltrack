package com.ovaltrack.backend.auth.registration.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, UUID> {

    List<RegistrationRequest> findAllByStatusOrderByCreatedAtAsc(RegistrationRequestStatus status);

    List<RegistrationRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<RegistrationRequest> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
            UUID userId,
            RegistrationRequestStatus status);
}