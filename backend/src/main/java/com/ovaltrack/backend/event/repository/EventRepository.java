package com.ovaltrack.backend.event.repository;

import java.util.Collection;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ovaltrack.backend.event.domain.Event;

public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query("SELECT e FROM Event e WHERE e.match.division.club.id = :clubId")
    Collection<Event> findEventsByClubId(@Param("clubId") UUID clubId);

    @Query("SELECT e FROM Event e WHERE e.match.division.id = :divisionId")
    Collection<Event> findEventsByDivisionId(@Param("divisionId") UUID divisionId);

    @Query("SELECT e FROM Event e WHERE e.match.id = :matchId")
    Collection<Event> findEventsByMatchId(@Param("matchId") UUID matchId);

    @Query("SELECT e FROM Event e WHERE e.id = :eventId AND e.match.id = :matchId")
    Event findEventByIdAndMatchId(@Param("eventId") UUID eventId, @Param("matchId") UUID matchId);

}
