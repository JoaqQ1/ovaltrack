package com.ovaltrack.backend.auth.registration.domain;

import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "registration_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RegistrationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_role", nullable = false)
    private UserRole requestedRole;

    // No todas las solicitudes pertenecen a un club por ejemplo las solicitudes de
    // administrador de club no pertenecen a un club hasta que se active la cuenta
    // con el club.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RegistrationRequestStatus status = RegistrationRequestStatus.PENDING;

    @Column(length = 1000)
    private String decisionComment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "decided_by_user_id")
    private User decidedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime decidedAt;
}