package com.ovaltrack.backend.person.repository;

import com.ovaltrack.backend.person.domain.Person;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, UUID> {

    Optional<Person> findByContactEmail(String contactEmail);

    boolean existsByContactEmail(String contactEmail);

    boolean existsByContactEmailIgnoreCase(String contactEmail);

    boolean existsByContactPhone(String contactPhone);

    List<Person> findAllByClubId(UUID clubId);

    @Query("""
        SELECT DISTINCT p
        FROM Person p
        JOIN DivisionPlayer dp ON dp.person.id = p.id
        JOIN dp.division d
        JOIN d.club c
        WHERE c.id = :clubId
        ORDER BY p.lastName, p.firstName
    """)
    Collection<Person> findPlayersByClubId(@Param("clubId") UUID clubId);

    @Query("""
        SELECT DISTINCT p
        FROM Person p
        JOIN DivisionPlayer dp ON dp.person.id = p.id
        JOIN dp.division d
        JOIN d.club c
        WHERE c.id = :clubId
        ORDER BY p.lastName, p.firstName
    """)
    Page<Person> findPaginatedPlayersByClubId(@Param("clubId") UUID clubId, Pageable pageable);
}
