package com.ovaltrack.backend.club.domain;

import com.ovaltrack.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "clubs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false)
    private String name;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubStatus status;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id", unique = true)
    private User adminUser;

    private String city;

    private String logoUrl;
    
    private String contactEmail;
    
    private String contactPhone;
}
