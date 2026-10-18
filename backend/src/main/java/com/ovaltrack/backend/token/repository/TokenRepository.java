package com.ovaltrack.backend.token.repository;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.token.domain.Token;

public interface TokenRepository extends JpaRepository<Token, UUID> {
    @Query("SELECT t FROM Token t WHERE t.hash=?1")
    Token findByHash(String hash);

    @Modifying
    @Query("UPDATE Token t SET t.used = true WHERE t.hash = :hash AND t.used = false AND t.expiresAt > :now")
    int markAsUsed(@Param("hash") String hash, @Param("now") LocalDateTime now);
}
