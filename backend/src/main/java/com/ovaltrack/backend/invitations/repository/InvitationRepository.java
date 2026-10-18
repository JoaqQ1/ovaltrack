package com.ovaltrack.backend.invitations.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.invitations.domain.Invitation;
import com.ovaltrack.backend.person.domain.Person;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    @Query("SELECT COUNT(i) > 0 FROM Invitation i WHERE i.person = ?1 AND i.division = ?2")
    boolean existsByPersonIdAndDivisionId(Person personId, Division divisionId);

    @Query ("SELECT i FROM Invitation i WHERE i.token.hash = :hash")
    Optional<Invitation> findByTokenHash(String hash);
}
