package com.ovaltrack.backend.auth.registration.domain;

import com.ovaltrack.backend.club.domain.dto.ClubCreationDTO;
import com.ovaltrack.backend.person.domain.dto.PersonCreationDTO;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalDate;
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

    @Column(name = "applicant_first_name", length = 100)
    private String applicantFirstName;

    @Column(name = "applicant_last_name", length = 100)
    private String applicantLastName;

    @Column(name = "applicant_birth_date")
    private LocalDate applicantBirthDate;

    @Column(name = "requested_club_name", length = 180)
    private String requestedClubName;

    @Column(name = "requested_club_city", length = 180)
    private String requestedClubCity;

    @Column(name = "requested_club_contact_email", length = 254)
    private String requestedClubContactEmail;

    @Column(name = "requested_club_contact_phone", length = 40)
    private String requestedClubContactPhone;

    @Column(name="club_id")
    private UUID clubId;

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

    public ClubCreationDTO toClubCreationDTO(){
        return new ClubCreationDTO(
                requestedClubName,
                user.getId(),
                requestedClubCity,
                null,
                requestedClubContactEmail,
                requestedClubContactPhone);
    }
    public PersonCreationDTO toPersonCreationDTO(){
        return new PersonCreationDTO(
            applicantFirstName, 
            applicantLastName, 
            applicantBirthDate, 
            user.getLoginEmail(), 
            null);
    }
}