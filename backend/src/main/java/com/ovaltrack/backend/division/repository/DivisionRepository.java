package com.ovaltrack.backend.division.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ovaltrack.backend.division.domain.Division;

public interface DivisionRepository extends JpaRepository<Division, UUID>{
}
