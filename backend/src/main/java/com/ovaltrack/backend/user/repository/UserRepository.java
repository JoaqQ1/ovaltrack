package com.ovaltrack.backend.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByLoginEmail(String loginEmail);

    boolean existsByLoginEmail(String loginEmail);

    Optional<User> findByPersonId(UUID personId);

    @Query("SELECT u FROM User u WHERE u.person.club.id = :clubId")
    List<User> findAllByClubId(@Param("clubId") UUID clubId);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.person.club.id = :clubId AND u.role = :role AND (u.active IS NULL OR u.active = true) AND u.id != :excludeUserId")
    boolean existsActiveAdminInClubExcludingUser(
            @Param("clubId") UUID clubId,
            @Param("role") UserRole role,
            @Param("excludeUserId") UUID excludeUserId
    );

    default Optional<User> findByEmail(String email) {
        return findByLoginEmail(email);
    }

    default boolean existsByEmail(String email) {
        return existsByLoginEmail(email);
    }
}