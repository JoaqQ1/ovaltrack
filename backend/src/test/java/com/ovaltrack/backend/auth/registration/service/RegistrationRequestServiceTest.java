package com.ovaltrack.backend.auth.registration.service;

import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;
import com.ovaltrack.backend.auth.registration.repository.RegistrationRequestRepository;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RegistrationRequestServiceTest {

    private RegistrationRequestRepository repository;
    private RegistrationRequestService service;
    private User user;
    private RegistrationRequest request;

    public RegistrationRequestServiceTest() {
        repository = mock(RegistrationRequestRepository.class);
        service = new RegistrationRequestService(repository);
        user = User.builder()
                .id(UUID.randomUUID())
                .role(UserRole.COACH_ANALYST)
                .build();
        request = aRegistrationRequest();
    }

    private RegistrationRequest aRegistrationRequest() {
        return RegistrationRequest.builder()
                .user(this.user)
                .requestedRole(this.user.getRole())
                .build();
    }

    // Crea una solicitud cuando el usuario no tiene solicitudes abiertas.
    @Test
    void saveShouldPersistRequestWhenUserHasNoPendingRequest() {
        // Given
        givenUserHasNoPendingRequest();
        when(this.repository.save(this.request)).thenReturn(this.request);

        // When
        RegistrationRequest savedRequest = service.createRequest(this.request);

        // Then
        assertSame(this.request, savedRequest);
        thenRepositoryCheckedForPendingRequest();
        thenRepositorySavedRequest();
    }

    // Permite una nueva solicitud si solo existen solicitudes historicas resueltas.
    @Test
    void saveShouldPersistRequestWhenUserHasOnlyResolvedHistoricalRequests() {
        // Given
        givenUserHasNoOpenRequests();
        when(this.repository.save(this.request)).thenReturn(this.request);

        // When
        RegistrationRequest savedRequest = this.service.createRequest(this.request);

        // Then
        assertSame(this.request, savedRequest);
        thenRepositoryCheckedForOpenRequests();
        thenRepositorySavedRequest();
    }

    private void givenUserHasNoOpenRequests() {
        givenNoRequestWithStatus(RegistrationRequestStatus.PENDING);
        givenNoRequestWithStatus(RegistrationRequestStatus.NEEDS_INFORMATION);
    }

    private void givenUserHasNoPendingRequest() {
        givenNoRequestWithStatus(RegistrationRequestStatus.PENDING);
        givenNoRequestWithStatus(RegistrationRequestStatus.NEEDS_INFORMATION);
    }

    private void givenNoRequestWithStatus(RegistrationRequestStatus status) {
        when(this.repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(this.user.getId(), status))
                .thenReturn(Optional.empty());
    }

    private void thenRepositoryCheckedForPendingRequest() {
        thenRepositoryCheckedForStatus(RegistrationRequestStatus.PENDING);
        thenRepositoryCheckedForStatus(RegistrationRequestStatus.NEEDS_INFORMATION);
    }

    private void thenRepositoryCheckedForOpenRequests() {
        thenRepositoryCheckedForPendingRequest();
    }

    private void thenRepositoryCheckedForStatus(RegistrationRequestStatus status) {
        verify(this.repository).findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(),
                status);
    }

    private void thenRepositorySavedRequest() {
        verify(this.repository).save(this.request);
    }

    @Test
    void findAllByStatusShouldReturnRepositoryResults() {
        // Given
        List<RegistrationRequest> expectedRequests = List.of(this.request);
        when(this.repository.findAllByStatusOrderByCreatedAtAsc(RegistrationRequestStatus.PENDING))
                .thenReturn(expectedRequests);

        // When
        List<RegistrationRequest> actualRequests = this.service
                .findAllByStatusOrderByCreatedAtAsc(RegistrationRequestStatus.PENDING);

        // Then
        assertEquals(expectedRequests, actualRequests);
        verify(this.repository).findAllByStatusOrderByCreatedAtAsc(RegistrationRequestStatus.PENDING);
    }

    @Test
    void findAllByStatusShouldRejectNullStatus() {
        // When & Then
        assertThrows(IllegalArgumentException.class,
                () -> this.service.findAllByStatusOrderByCreatedAtAsc(null));
        verifyNoInteractions(this.repository);
    }

    @Test
    void findAllByUserIdShouldReturnRepositoryResults() {
        // Given
        List<RegistrationRequest> expectedRequests = List.of(this.request);
        when(this.repository.findAllByUserIdOrderByCreatedAtDesc(this.user.getId()))
                .thenReturn(expectedRequests);

        // When
        List<RegistrationRequest> actualRequests = this.service
                .findAllByUserIdOrderByCreatedAtDesc(this.user.getId());

        // Then
        assertEquals(expectedRequests, actualRequests);
        verify(this.repository).findAllByUserIdOrderByCreatedAtDesc(this.user.getId());
    }

    @Test
    void findAllByUserIdShouldRejectNullUserId() {
        // When & Then
        assertThrows(IllegalArgumentException.class,
                () -> this.service.findAllByUserIdOrderByCreatedAtDesc(null));
        verifyNoInteractions(this.repository);
    }

    @Test
    void findFirstByUserIdAndStatusShouldReturnRepositoryResult() {
        // Given
        when(this.repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(),
                RegistrationRequestStatus.PENDING))
                .thenReturn(Optional.of(this.request));

        // When
        RegistrationRequest actualRequest = this.service.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(), RegistrationRequestStatus.PENDING);

        // Then
        assertSame(this.request, actualRequest);
        verify(this.repository).findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(), RegistrationRequestStatus.PENDING);
    }

    @Test
    void findFirstByUserIdAndStatusShouldReturnNullWhenRepositoryHasNoResult() {
        // Given
        when(this.repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(),
                RegistrationRequestStatus.PENDING))
                .thenReturn(Optional.empty());

        // When
        RegistrationRequest actualRequest = this.service.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(), RegistrationRequestStatus.PENDING);

        // Then
        assertNull(actualRequest);
    }

    @Test
    void findFirstByUserIdAndStatusShouldRejectNullUserId() {
        // When & Then
        assertThrows(IllegalArgumentException.class,
                () -> this.service.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                        null, RegistrationRequestStatus.PENDING));
        verifyNoInteractions(this.repository);
    }

    @Test
    void findFirstByUserIdAndStatusShouldRejectNullStatus() {
        // When & Then
        assertThrows(IllegalArgumentException.class,
                () -> this.service.findFirstByUserIdAndStatusOrderByCreatedAtDesc(this.user.getId(), null));
        verifyNoInteractions(this.repository);
    }

    // Rechaza una solicitud null.
    @Test
    void saveShouldThrowExceptionWhenRequestIsNull() {
        // Given
        RegistrationRequest aRegistrationRequestNull = null;

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            this.service.createRequest(aRegistrationRequestNull);
        });

        // Ya que no se llego a interactuar con el repository es buena practica cortar
        // la ejecucion antes de gastar recursos.
        verifyNoInteractions(this.repository);
    }

    // Rechaza una solicitud sin usuario.
    @Test
    void saveShouldThrowExceptionWhenUserIsNull() {
        // Given
        RegistrationRequest requestWithoutUser = RegistrationRequest.builder()
                .requestedRole(UserRole.COACH_ANALYST)
                .build();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            this.service.createRequest(requestWithoutUser);
        });

        verifyNoInteractions(this.repository);
    }

    // Rechaza una solicitud cuyo usuario no tiene ID.
    @Test
    void saveShouldThrowExceptionWhenUserIdIsNull() {
        // Given
        User userWithoutId = User.builder()
                .id(null)
                .build();
        RegistrationRequest requestWithoutUserId = RegistrationRequest.builder()
                .user(userWithoutId)
                .requestedRole(UserRole.COACH_ANALYST)
                .build();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> this.service.createRequest(requestWithoutUserId));
        verifyNoInteractions(this.repository);
    }

    // Rechaza guardar si el repositorio encuentra una solicitud PENDING previa.
    @Test
    void createRequestShouldThrowExceptionWhenPendingRequestExists() {
        // Given
        when(this.repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(this.user.getId(),
                RegistrationRequestStatus.PENDING))
                .thenReturn(Optional.of(new RegistrationRequest()));

        // When & Then
        assertThrows(BusinessException.class, () -> this.service.createRequest(this.request));

        verify(this.repository, never()).save(any());
    }

    @Test
    void createRequestShouldThrowExceptionWhenRequestNeedsInformation() {
        // Given
        givenNoRequestWithStatus(RegistrationRequestStatus.PENDING);
        when(this.repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                this.user.getId(), RegistrationRequestStatus.NEEDS_INFORMATION))
                .thenReturn(Optional.of(new RegistrationRequest()));

        // When & Then
        assertThrows(BusinessException.class, () -> this.service.createRequest(this.request));
        verify(this.repository, never()).save(any());
    }
}