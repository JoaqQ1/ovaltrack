package com.ovaltrack.backend.match.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.dto.MatchRosterPlayerDTO;
import com.ovaltrack.backend.match.repository.MatchRepository;
import com.ovaltrack.backend.person.domain.Person;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchService Unit Tests")
class MatchServiceTest {

    @Mock
    private MatchRepository matchRepository;

    @InjectMocks
    private MatchService matchService;

    @Test
    @DisplayName("getMatchRosterPlayers should return sorted players: starters first then substitutes, alphabetically")
    void getMatchRosterPlayers_Success() {
        UUID matchId = UUID.randomUUID();

        Person p1 = Person.builder().id(UUID.randomUUID()).firstName("Bernardo").lastName("Alvarez").build();
        Person p2 = Person.builder().id(UUID.randomUUID()).firstName("Agustín").lastName("Zapata").build();
        Person p3 = Person.builder().id(UUID.randomUUID()).firstName("Carlos").lastName("Bustos").build();

        DivisionPlayer dp1 = DivisionPlayer.builder().id(UUID.randomUUID()).person(p1).position("Apertura").build();
        DivisionPlayer dp2 = DivisionPlayer.builder().id(UUID.randomUUID()).person(p2).position("Pilar").build();
        DivisionPlayer dp3 = DivisionPlayer.builder().id(UUID.randomUUID()).person(p3).position("Hooker").build();

        MatchPlayer mp1 = MatchPlayer.builder().divisionPlayer(dp1).role(MatchPlayerRole.SUPLENTE).build();
        MatchPlayer mp2 = MatchPlayer.builder().divisionPlayer(dp2).role(MatchPlayerRole.TITULAR).build();
        MatchPlayer mp3 = MatchPlayer.builder().divisionPlayer(dp3).role(MatchPlayerRole.TITULAR).build();

        List<MatchPlayer> roster = new ArrayList<>(List.of(mp1, mp2, mp3));
        Match match = Match.builder().id(matchId).roster(roster).build();

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));

        List<MatchRosterPlayerDTO> result = matchService.getMatchRosterPlayers(matchId);

        assertNotNull(result);
        assertEquals(3, result.size());

        // Starters first: Agustín Zapata, Carlos Bustos
        assertEquals("Agustín Zapata", result.get(0).getFullName());
        assertEquals(MatchPlayerRole.TITULAR, result.get(0).getRole());

        assertEquals("Carlos Bustos", result.get(1).getFullName());
        assertEquals(MatchPlayerRole.TITULAR, result.get(1).getRole());

        // Substitute last: Bernardo Alvarez
        assertEquals("Bernardo Alvarez", result.get(2).getFullName());
        assertEquals(MatchPlayerRole.SUPLENTE, result.get(2).getRole());
    }

    @Test
    @DisplayName("getMatchRosterPlayers should return empty list when roster is empty")
    void getMatchRosterPlayers_EmptyRoster() {
        UUID matchId = UUID.randomUUID();
        Match match = Match.builder().id(matchId).roster(new ArrayList<>()).build();

        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));

        List<MatchRosterPlayerDTO> result = matchService.getMatchRosterPlayers(matchId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getMatchRosterPlayers should throw EntityNotFoundException when match does not exist")
    void getMatchRosterPlayers_NotFound() {
        UUID matchId = UUID.randomUUID();
        when(matchRepository.findById(matchId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> matchService.getMatchRosterPlayers(matchId));
    }
}
