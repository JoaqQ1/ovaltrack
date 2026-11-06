package com.ovaltrack.backend.match.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchPlayerStatus;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchService - validación de cambios")
class MatchSubstitutionTest {

    @InjectMocks
    private MatchService matchService;

    @Mock
    private EventRepository eventRepository;

    @Spy
    private LineupReplayer lineupReplayer;

    private Match match;
    private MatchPlayer starter;
    private MatchPlayer substitute;

    private static MatchPlayer rosterPlayer(MatchPlayerRole role, int slotOrder, int number) {
        Person person = Person.builder().id(UUID.randomUUID()).build();
        return MatchPlayer.builder()
                .id(UUID.randomUUID())
                .divisionPlayer(DivisionPlayer.builder().person(person).build())
                .role(role)
                .slotOrder(slotOrder)
                .number(number)
                .fieldStatus(role == MatchPlayerRole.TITULAR
                        ? MatchPlayerStatus.EN_CANCHA
                        : MatchPlayerStatus.EN_BANCO)
                .fieldSlot(role == MatchPlayerRole.TITULAR ? slotOrder + 1 : null)
                .build();
    }

    @BeforeEach
    void buildRoster() {
        when(eventRepository.findEventsByMatchId(any())).thenReturn(List.of());
        // Número permanente 7 (titular) y 22 (suplente).
        starter = rosterPlayer(MatchPlayerRole.TITULAR, 1, 7);
        substitute = rosterPlayer(MatchPlayerRole.SUPLENTE, 1, 22);
        match = Match.builder()
                .id(UUID.randomUUID())
                .roster(new ArrayList<>(List.of(rosterPlayer(MatchPlayerRole.TITULAR, 0, 1), starter, substitute)))
                .build();
    }

    private static String personId(MatchPlayer player) {
        return player.getDivisionPlayer().getPerson().getId().toString();
    }

    private Event substitution(Map<String, Object> attributes) {
        return Event.builder()
                .id(UUID.randomUUID())
                .eventType(EventType.builder().code("SUBSTITUTION").build())
                .match(match)
                .teamPossession(EventPossession.OWN)
                .attributes(attributes)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("acepta un cambio identificado por los ids de los jugadores")
    void acceptsPlayerIds() {
        assertDoesNotThrow(() -> matchService.validateSubstitution(match, substitution(Map.of(
                "playerOutId", personId(starter), "playerInId", personId(substitute),
                "playerOutNumber", 7, "playerInNumber", 22))));
    }

    @Test
    @DisplayName("sin ids resuelve por número permanente y no modifica el plantel")
    void resolvesByPermanentNumberWithoutTouchingRoster() {
        matchService.validateSubstitution(match, substitution(Map.of("playerOutNumber", 7, "playerInNumber", 22)));

        assertEquals(MatchPlayerRole.TITULAR, starter.getRole());
        assertEquals(MatchPlayerRole.SUPLENTE, substitute.getRole());
    }

    @Test
    @DisplayName("rechaza un jugador que no está en el plantel")
    void rejectsPlayerOutsideRoster() {
        assertThrows(BusinessException.class, () -> matchService.validateSubstitution(match, substitution(Map.of(
                "playerOutNumber", 7, "playerInNumber", 23))));
    }

    @Test
    @DisplayName("rechaza que salga y entre el mismo jugador")
    void rejectsSamePlayer() {
        assertThrows(BusinessException.class, () -> matchService.validateSubstitution(match, substitution(Map.of(
                "playerOutId", personId(starter), "playerInId", personId(starter),
                "playerOutNumber", 7, "playerInNumber", 7))));
    }
}
