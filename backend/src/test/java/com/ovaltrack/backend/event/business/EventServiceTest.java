package com.ovaltrack.backend.event.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.dto.event.EventCreationDTO;
import com.ovaltrack.backend.event.domain.dto.event.EventResponseDTO;
import com.ovaltrack.backend.event.domain.dto.event.MatchTimelineEventResponseDTO;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.match.business.MatchSecurityValidator;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.match.repository.MatchRepository;
import com.ovaltrack.backend.person.business.PersonService;

@ExtendWith(MockitoExtension.class)
@DisplayName("EventService Unit Tests (HU-8.4)")
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventTypeService eventTypeService;

    @Mock
    private ClubService clubService;

    @Mock
    private MatchService matchService;

    @Mock
    private PersonService personService;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private MatchSecurityValidator matchSecurityValidator;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private EventService eventService;

    @Test
    @DisplayName("saveEvent: Permite alta post_capture en partido FINISHED y autocompleta realTime si es null")
    void saveEvent_shouldSucceedInFinishedMatch_withPostCaptureOrigin() {
        UUID matchId = UUID.randomUUID();
        UUID eventTypeId = UUID.randomUUID();

        EventType eventType = new EventType();
        eventType.setId(eventTypeId);
        eventType.setName("Try");
        eventType.setIsScoring(true);
        eventType.setPoints(5);

        Match match = new Match();
        match.setId(matchId);
        match.setStatus(MatchStatus.FINISHED);

        EventCreationDTO request = new EventCreationDTO(
                eventTypeId,
                matchId,
                null,
                null,
                EventPossession.OWN,
                900,
                900,
                null,
                1,
                Event.ORIGIN_POST_CAPTURE,
                Map.of("note", "Post-match try"),
                null
        );

        when(eventTypeService.findEventTypeEntityById(eventTypeId)).thenReturn(eventType);
        when(matchService.findMatchEntityById(matchId)).thenReturn(match);
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(eventRepository.findEventsByMatchId(matchId)).thenReturn(List.of());

        EventResponseDTO response = eventService.saveEvent(request, authentication);

        assertNotNull(response);
        assertEquals(Event.ORIGIN_POST_CAPTURE, response.origin());
        assertNotNull(response.realTime());
        verify(matchSecurityValidator).validateCanManageMatch(match, authentication);
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    @DisplayName("saveEvent: Rechaza alta en partido FINISHED si origin no es post_capture")
    void saveEvent_shouldThrowException_whenMatchFinishedAndOriginNotPostCapture() {
        UUID matchId = UUID.randomUUID();
        UUID eventTypeId = UUID.randomUUID();

        EventType eventType = new EventType();
        eventType.setId(eventTypeId);

        Match match = new Match();
        match.setId(matchId);
        match.setStatus(MatchStatus.FINISHED);

        EventCreationDTO request = new EventCreationDTO(
                eventTypeId,
                matchId,
                null,
                null,
                EventPossession.OWN,
                900,
                900,
                LocalDateTime.now(),
                1,
                "live-capture",
                null,
                null
        );

        when(eventTypeService.findEventTypeEntityById(eventTypeId)).thenReturn(eventType);
        when(matchService.findMatchEntityById(matchId)).thenReturn(match);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> eventService.saveEvent(request, authentication));

        assertTrue(ex.getMessage().contains("No se puede cargar eventos"));
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("saveEvent: Falla con AccessDeniedException si matchSecurityValidator deniega el acceso")
    void saveEvent_shouldPropagateAccessDenied_whenUserNotAuthorized() {
        UUID matchId = UUID.randomUUID();
        UUID eventTypeId = UUID.randomUUID();

        EventType eventType = new EventType();
        eventType.setId(eventTypeId);

        Match match = new Match();
        match.setId(matchId);
        match.setStatus(MatchStatus.FINISHED);

        EventCreationDTO request = new EventCreationDTO(
                eventTypeId,
                matchId,
                null,
                null,
                EventPossession.OWN,
                900,
                900,
                LocalDateTime.now(),
                1,
                Event.ORIGIN_POST_CAPTURE,
                null,
                null
        );

        when(eventTypeService.findEventTypeEntityById(eventTypeId)).thenReturn(eventType);
        when(matchService.findMatchEntityById(matchId)).thenReturn(match);
        doThrow(new AccessDeniedException("Acceso denegado"))
                .when(matchSecurityValidator).validateCanManageMatch(match, authentication);

        assertThrows(AccessDeniedException.class, () -> eventService.saveEvent(request, authentication));
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("findPostMatchEvents: Mapea correctamente origin y attributes en MatchTimelineEventResponseDTO")
    void findPostMatchEvents_shouldIncludeOriginAndAttributes() {
        UUID matchId = UUID.randomUUID();

        Match match = new Match();
        match.setId(matchId);
        match.setStatus(MatchStatus.FINISHED);

        EventType eventType = new EventType();
        eventType.setId(UUID.randomUUID());
        eventType.setName("Tackle completado");

        Event event = new Event();
        event.setId(UUID.randomUUID());
        event.setEventType(eventType);
        event.setMatch(match);
        event.setPeriod(1);
        event.setMatchTime(600);
        event.setRealTime(LocalDateTime.now());
        event.setTeamPossession(EventPossession.OWN);
        event.setOrigin(Event.ORIGIN_POST_CAPTURE);
        event.setAttributes(Map.of("card", "YELLOW"));
        event.setActive(true);

        when(matchService.findMatchEntityById(matchId)).thenReturn(match);
        when(eventRepository.findPostMatchEventsByMatchId(matchId)).thenReturn(List.of(event));

        Collection<MatchTimelineEventResponseDTO> result = eventService.findPostMatchEvents(matchId, authentication);

        assertEquals(1, result.size());
        MatchTimelineEventResponseDTO dto = result.iterator().next();
        assertEquals(Event.ORIGIN_POST_CAPTURE, dto.origin());
        assertEquals("YELLOW", dto.attributes().get("card"));
        verify(matchSecurityValidator).validateCanManageMatch(match, authentication);
    }
}
