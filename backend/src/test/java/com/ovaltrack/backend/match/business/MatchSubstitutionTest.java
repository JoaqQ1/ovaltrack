package com.ovaltrack.backend.match.business;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.person.domain.Person;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchService - validación de cambios")
class MatchSubstitutionTest {

    @InjectMocks
    private MatchService matchService;

    private Match match;
    private MatchPlayer starter;
    private MatchPlayer substitute;

    private static MatchPlayer rosterPlayer(MatchPlayerRole role, int slotOrder) {
        Person person = Person.builder().id(UUID.randomUUID()).build();
        return MatchPlayer.builder()
                .divisionPlayer(DivisionPlayer.builder().person(person).build())
                .role(role)
                .slotOrder(slotOrder)
                .build();
    }

    @BeforeEach
    void buildRoster() {
        // Slot 2 (titular, slotOrder 1) y slot 17 (suplente, slotOrder 1).
        starter = rosterPlayer(MatchPlayerRole.TITULAR, 1);
        substitute = rosterPlayer(MatchPlayerRole.SUPLENTE, 1);
        match = Match.builder()
                .roster(new ArrayList<>(List.of(rosterPlayer(MatchPlayerRole.TITULAR, 0), starter, substitute)))
                .build();
    }

    private static String personId(MatchPlayer player) {
        return player.getDivisionPlayer().getPerson().getId().toString();
    }

    @Test
    @DisplayName("acepta un cambio identificado por los ids de los jugadores")
    void acceptsPlayerIds() {
        assertDoesNotThrow(() -> matchService.validateSubstitution(match, Map.of(
                "playerOutId", personId(starter), "playerInId", personId(substitute),
                "playerOutNumber", 2, "playerInNumber", 17)));
    }

    @Test
    @DisplayName("sin ids resuelve por número de slot y no modifica el plantel")
    void resolvesBySlotNumberWithoutTouchingRoster() {
        matchService.validateSubstitution(match, Map.of("playerOutNumber", 2, "playerInNumber", 17));

        assertEquals(MatchPlayerRole.TITULAR, starter.getRole());
        assertEquals(MatchPlayerRole.SUPLENTE, substitute.getRole());
    }

    @Test
    @DisplayName("rechaza un jugador que no está en el plantel")
    void rejectsPlayerOutsideRoster() {
        assertThrows(BusinessException.class, () -> matchService.validateSubstitution(match, Map.of(
                "playerOutNumber", 2, "playerInNumber", 23)));
    }

    @Test
    @DisplayName("rechaza que salga y entre el mismo jugador")
    void rejectsSamePlayer() {
        assertThrows(BusinessException.class, () -> matchService.validateSubstitution(match, Map.of(
                "playerOutId", personId(starter), "playerInId", personId(starter),
                "playerOutNumber", 2, "playerInNumber", 2)));
    }
}
