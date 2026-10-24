package com.ovaltrack.backend.match.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.division.repository.DivisionPlayerRepository;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.match.domain.dto.MatchResponseDTO;
import com.ovaltrack.backend.match.repository.MatchPlayerRepository;
import com.ovaltrack.backend.match.repository.MatchRepository;
import com.ovaltrack.backend.person.domain.Person;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchService - robustez de la sincronización offline")
class MatchServiceOfflineSyncTest {

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private MatchPlayerRepository matchPlayerRepository;

    @Mock
    private DivisionPlayerRepository divisionPlayerRepository;

    @InjectMocks
    private MatchService matchService;

    private final UUID matchId = UUID.randomUUID();

    @BeforeEach
    void injectFieldDependencies() {
        ReflectionTestUtils.setField(matchService, "matchPlayerRepository", matchPlayerRepository);
        ReflectionTestUtils.setField(matchService, "divisionPlayerRepository", divisionPlayerRepository);
    }

    private Match matchWithStatus(MatchStatus status) {
        Match match = Match.builder().id(matchId).status(status).roster(new ArrayList<>()).build();
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        return match;
    }

    private void saveReturnsArgument() {
        when(matchRepository.save(any(Match.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("un start atrasado no reabre un partido cancelado")
    void start_onCancelledMatch_isRejected() {
        matchWithStatus(MatchStatus.CANCELLED);

        assertThrows(BusinessException.class,
                () -> matchService.changeMatchStatus(matchId, MatchStatus.IN_PROGRESS));
        verify(matchRepository, never()).save(any());
    }

    @Test
    @DisplayName("un start atrasado no reabre un partido finalizado")
    void start_onFinishedMatch_isRejected() {
        matchWithStatus(MatchStatus.FINISHED);

        assertThrows(BusinessException.class,
                () -> matchService.changeMatchStatus(matchId, MatchStatus.IN_PROGRESS));
    }

    @Test
    @DisplayName("cerrar el primer tiempo o iniciar el segundo no reabre un partido terminal")
    void halfTransitions_onTerminalMatch_areRejected() {
        Match finished = Match.builder().status(MatchStatus.FINISHED).currentPeriod(2).build();
        Match cancelled = Match.builder().status(MatchStatus.CANCELLED).build();

        assertThrows(BusinessException.class, finished::startSecondHalf);
        assertThrows(BusinessException.class, cancelled::closeFirstHalf);
        assertEquals(MatchStatus.FINISHED, finished.getStatus());
        assertEquals(MatchStatus.CANCELLED, cancelled.getStatus());
    }

    @Test
    @DisplayName("finish usa la hora informada por el cliente")
    void finish_usesClientOccurredAt() {
        Match match = matchWithStatus(MatchStatus.IN_PROGRESS);
        match.setStartedAt(LocalDateTime.of(2026, 10, 23, 15, 0));
        saveReturnsArgument();
        Instant occurredAt = Instant.parse("2026-10-23T16:25:00Z");

        MatchResponseDTO result = matchService.changeMatchStatus(matchId, MatchStatus.FINISHED, occurredAt);

        assertEquals(LocalDateTime.of(2026, 10, 23, 16, 25), match.getFinishedAt());
        assertEquals(MatchStatus.FINISHED, result.status());
    }

    @Test
    @DisplayName("finish no acepta una hora futura ni anterior al inicio")
    void finish_clampsClientOccurredAt() {
        Match match = matchWithStatus(MatchStatus.IN_PROGRESS);
        LocalDateTime startedAt = LocalDateTime.of(2026, 10, 23, 15, 0);
        match.setStartedAt(startedAt);
        saveReturnsArgument();

        LocalDateTime before = LocalDateTime.now(ZoneOffset.UTC);
        matchService.changeMatchStatus(matchId, MatchStatus.FINISHED, Instant.now().plusSeconds(3600));
        assertFalse(match.getFinishedAt().isBefore(before));
        assertFalse(match.getFinishedAt().isAfter(LocalDateTime.now(ZoneOffset.UTC)));

        match.setStatus(MatchStatus.IN_PROGRESS);
        matchService.changeMatchStatus(matchId, MatchStatus.FINISHED, Instant.parse("2026-10-23T14:00:00Z"));
        assertEquals(startedAt, match.getFinishedAt());
    }

    @Test
    @DisplayName("start usa la hora informada por el cliente")
    void start_usesClientOccurredAt() {
        Person person = Person.builder().id(UUID.randomUUID()).build();
        Match match = matchWithStatus(MatchStatus.NOT_STARTED);
        match.getRoster().add(MatchPlayer.builder()
                .divisionPlayer(DivisionPlayer.builder().person(person).build())
                .role(MatchPlayerRole.TITULAR)
                .build());
        saveReturnsArgument();

        matchService.changeMatchStatus(matchId, MatchStatus.IN_PROGRESS, Instant.parse("2026-10-23T15:02:00Z"));

        assertEquals(LocalDateTime.of(2026, 10, 23, 15, 2), match.getStartedAt());
    }

    @Test
    @DisplayName("el plantel conserva el orden recibido, solo usa jugadores de la división y no duplica")
    void saveMatchRoster_keepsOrderAndAvoidsDuplicates() {
        Division division = Division.builder().id(UUID.randomUUID()).build();
        Match match = matchWithStatus(MatchStatus.NOT_STARTED);
        match.setDivision(division);

        Person first = Person.builder().id(UUID.randomUUID()).build();
        Person second = Person.builder().id(UUID.randomUUID()).build();
        Person substitute = Person.builder().id(UUID.randomUUID()).build();
        when(divisionPlayerRepository.findByDivisionId(division.getId())).thenReturn(List.of(
                DivisionPlayer.builder().person(substitute).build(),
                DivisionPlayer.builder().person(second).build(),
                DivisionPlayer.builder().person(first).build()));

        matchService.saveMatchRoster(
                matchId,
                List.of(first.getId(), second.getId(), first.getId()),
                List.of(substitute.getId(), UUID.randomUUID()));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MatchPlayer>> saved = ArgumentCaptor.forClass(List.class);
        verify(matchPlayerRepository).saveAll(saved.capture());
        List<MatchPlayer> roster = saved.getValue();

        assertEquals(List.of(first.getId(), second.getId(), substitute.getId()),
                roster.stream().map(mp -> mp.getDivisionPlayer().getPerson().getId()).toList());
        assertEquals(List.of(MatchPlayerRole.TITULAR, MatchPlayerRole.TITULAR, MatchPlayerRole.SUPLENTE),
                roster.stream().map(MatchPlayer::getRole).toList());
        assertEquals(List.of(0, 1, 0), roster.stream().map(MatchPlayer::getSlotOrder).toList());
        verify(divisionPlayerRepository, never()).findAll();
    }
}
