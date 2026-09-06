package com.ovaltrack.backend.event.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ovaltrack.backend.event.domain.EventType;

public interface EventTypeRepository extends JpaRepository<EventType, UUID> {
    
}
