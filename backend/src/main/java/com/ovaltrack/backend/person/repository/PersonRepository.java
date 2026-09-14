package com.ovaltrack.backend.person.repository;

import com.ovaltrack.backend.person.domain.Person;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, UUID> {

    Optional<Person> findByContactEmail(String contactEmail);

    boolean existsByContactEmail(String contactEmail);
}
