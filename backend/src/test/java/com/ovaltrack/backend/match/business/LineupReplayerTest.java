package com.ovaltrack.backend.match.business;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.ovaltrack.backend.division.domain.DivisionPlayer;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchPlayerStatus;
import com.ovaltrack.backend.person.domain.Person;

class LineupReplayerTest {

    private final LineupReplayer replayer = new LineupReplayer();

    @Test
    void aplicaCadenaYReingresoConNumeroPermanente() {
        MatchPlayer starter = player("starter", MatchPlayerRole.TITULAR, 0, 7);
        MatchPlayer secondStarter = player("second", MatchPlayerRole.TITULAR, 2, 8);
        MatchPlayer firstSub = player("first-sub", MatchPlayerRole.SUPLENTE, 0, 16);
        MatchPlayer secondSub = player("second-sub", MatchPlayerRole.SUPLENTE, 1, 19);
        Match match = match(starter, secondStarter, firstSub, secondSub);

        Event first = substitution(match, 1, 7, 16, firstSub);
        Event second = substitution(match, 2, 16, 19, secondSub);
        Event third = substitution(match, 3, 19, 7, starter);

        replayer.replay(match, List.of(first, second, third));

        assertEquals(MatchPlayerStatus.EN_CANCHA, starter.getFieldStatus());
        assertEquals(1, starter.getFieldSlot());
        assertEquals(MatchPlayerStatus.EN_BANCO, firstSub.getFieldStatus());
        assertEquals(MatchPlayerStatus.EN_BANCO, secondSub.getFieldStatus());
    }

    @Test
    void rechazaIdInvalidoAunqueElNumeroSeaValido() {
        MatchPlayer starter = player("starter", MatchPlayerRole.TITULAR, 0, 7);
        MatchPlayer substitute = player("substitute", MatchPlayerRole.SUPLENTE, 0, 16);
        Match match = match(starter, substitute);
        Event event = Event.builder()
                .id(UUID.randomUUID())
                .eventType(type())
                .match(match)
                .teamPossession(EventPossession.OWN)
                .active(true)
                .attributes(Map.of("playerOutId", "not-a-uuid", "playerOutNumber", 7,
                        "playerInNumber", 16))
                .build();

        assertThrows(RuntimeException.class, () -> replayer.replay(match, List.of(event)));
    }

    @Test
    void ordenaEventosAunqueLleguenFueraDeOrden() {
        MatchPlayer starter = player("starter", MatchPlayerRole.TITULAR, 0, 7);
        MatchPlayer firstSub = player("first-sub", MatchPlayerRole.SUPLENTE, 0, 16);
        MatchPlayer secondSub = player("second-sub", MatchPlayerRole.SUPLENTE, 1, 19);
        Match match = match(starter, firstSub, secondSub);

        Event first = substitution(match, 10, 7, 16, firstSub);
        Event second = substitution(match, 20, 16, 19, secondSub);
        replayer.replay(match, List.of(second, first));

        assertEquals(MatchPlayerStatus.EN_CANCHA, secondSub.getFieldStatus());
        assertEquals(MatchPlayerStatus.EN_BANCO, firstSub.getFieldStatus());
    }

    private Event substitution(Match match, int time, int outNumber, int inNumber, MatchPlayer in) {
        return Event.builder().id(UUID.randomUUID()).eventType(type()).match(match)
                .teamPossession(EventPossession.OWN).absoluteMatchTime(time).active(true)
                .attributes(Map.of("playerOutNumber", outNumber, "playerInNumber", inNumber,
                        "playerInId", in.getDivisionPlayer().getPerson().getId().toString()))
                .build();
    }

    private EventType type() {
        return EventType.builder().id(UUID.randomUUID()).code("SUBSTITUTION").build();
    }

    private Match match(MatchPlayer... players) {
        Match match = Match.builder().id(UUID.randomUUID()).roster(new ArrayList<>(List.of(players))).build();
        match.getRoster().forEach(player -> player.setMatch(match));
        return match;
    }

    private MatchPlayer player(String name, MatchPlayerRole role, int order, int number) {
        Person person = Person.builder().id(UUID.randomUUID()).firstName(name).lastName(name).build();
        return MatchPlayer.builder().id(UUID.randomUUID())
                .divisionPlayer(DivisionPlayer.builder().person(person).build())
                .role(role).slotOrder(order).number(number)
                .fieldStatus(role == MatchPlayerRole.TITULAR ? MatchPlayerStatus.EN_CANCHA : MatchPlayerStatus.EN_BANCO)
                .fieldSlot(role == MatchPlayerRole.TITULAR ? order + 1 : null).build();
    }
}
