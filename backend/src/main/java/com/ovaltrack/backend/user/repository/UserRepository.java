package com.ovaltrack.backend.user.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ovaltrack.backend.user.domain.User;

public interface UserRepository extends JpaRepository<User, UUID> {
}
