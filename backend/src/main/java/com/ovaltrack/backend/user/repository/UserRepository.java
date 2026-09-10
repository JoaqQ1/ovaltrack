package com.ovaltrack.backend.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ovaltrack.backend.user.domain.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByLoginEmail(String loginEmail);

    boolean existsByLoginEmail(String loginEmail);

    Optional<User> findByPersonId(UUID personId);

    default Optional<User> findByEmail(String email) {
        return findByLoginEmail(email);
    }

    default boolean existsByEmail(String email) {
        return existsByLoginEmail(email);
    }
}