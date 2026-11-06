package com.ovaltrack.backend.match.business;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;
import com.ovaltrack.backend.match.domain.MatchPlayerRole;
import com.ovaltrack.backend.match.domain.MatchPlayerStatus;

@Component
public class LineupReplayer {

    public void replay(Match match, List<Event> sourceEvents) {
        Map<MatchPlayer, State> states = initialStates(match);
        List<Event> events = new ArrayList<>(sourceEvents);
        events.stream()
                .filter(this::isOwnSubstitution)
                .filter(event -> Boolean.TRUE.equals(event.getActive()))
                .sorted(eventComparator())
                .forEach(event -> apply(states, event));

        states.forEach((player, state) -> {
            player.setFieldStatus(state.status());
            player.setFieldSlot(state.fieldSlot());
        });
    }

    private Map<MatchPlayer, State> initialStates(Match match) {
        Map<MatchPlayer, State> states = new HashMap<>();
        for (MatchPlayer player : match.getRoster()) {
            if (player.getRole() == MatchPlayerRole.TITULAR) {
                if (player.getSlotOrder() == null) {
                    throw new BusinessException("Roster corrupto: el titular " + player.getNumber()
                            + " no tiene posición inicial");
                }
                states.put(player, new State(MatchPlayerStatus.EN_CANCHA, player.getSlotOrder() + 1));
            } else {
                states.put(player, new State(MatchPlayerStatus.EN_BANCO, null));
            }
        }
        return states;
    }

    private void apply(Map<MatchPlayer, State> states, Event event) {
        MatchPlayer outgoing = resolve(states, event, "playerOutId", "playerOutNumber", event.getId());
        MatchPlayer incoming = resolve(states, event, "playerInId", "playerInNumber", event.getId());
        if (outgoing == incoming) {
            invalid(event, "el jugador saliente y entrante deben ser distintos");
        }
        State out = states.get(outgoing);
        State in = states.get(incoming);
        if (out == null || in == null) {
            invalid(event, "los jugadores no pertenecen al plantel");
        }
        if (out.status() != MatchPlayerStatus.EN_CANCHA) {
            invalid(event, "el jugador saliente no está en cancha");
        }
        if (in.status() != MatchPlayerStatus.EN_BANCO) {
            invalid(event, "el jugador entrante no está en banco");
        }
        states.put(outgoing, new State(MatchPlayerStatus.EN_BANCO, null));
        states.put(incoming, new State(MatchPlayerStatus.EN_CANCHA, out.fieldSlot()));
    }

    private MatchPlayer resolve(Map<MatchPlayer, State> states, Event event, String idKey,
            String numberKey, UUID eventId) {
        Object rawId = event.getAttributes() == null ? null : event.getAttributes().get(idKey);
        MatchPlayer byId = null;
        if (rawId != null) {
            if (!(rawId instanceof String id)) {
                invalid(event, "el identificador " + idKey + " no es válido");
            }
            try {
                UUID personId = UUID.fromString((String) rawId);
                byId = states.keySet().stream()
                        .filter(player -> personId.equals(player.getDivisionPlayer().getPerson().getId()))
                        .findFirst().orElse(null);
            } catch (IllegalArgumentException ex) {
                invalid(event, "el identificador " + idKey + " no es un UUID válido");
            }
            if (byId == null) {
                invalid(event, "el jugador " + idKey + " no pertenece al plantel");
            }
            Integer number = readNumber(event, numberKey);
            if (number != null && !number.equals(byId.getNumber())) {
                invalid(event, "el número " + numberKey + " no coincide con el jugador");
            }
            return byId;
        }

        Integer number = readNumber(event, numberKey);
        if (number == null) {
            invalid(event, "falta " + idKey + " o " + numberKey);
        }
        return states.keySet().stream().filter(player -> number.equals(player.getNumber()))
                .findFirst().orElseThrow(() -> new BusinessException("Evento " + event.getId()
                        + ": el jugador " + numberKey + " no pertenece al plantel"));
    }

    private Integer readNumber(Event event, String key) {
        Object value = event.getAttributes() == null ? null : event.getAttributes().get(key);
        if (value == null) return null;
        if (!(value instanceof Number number) || number.doubleValue() != number.intValue() || number.intValue() <= 0) {
            invalid(event, "el campo " + key + " debe ser un entero positivo");
        }
        return ((Number) value).intValue();
    }

    private boolean isOwnSubstitution(Event event) {
        return event.getEventType() != null
                && "SUBSTITUTION".equals(event.getEventType().getCode())
                && event.getTeamPossession() == EventPossession.OWN;
    }

    private Comparator<Event> eventComparator() {
        return Comparator.comparing(Event::getAbsoluteMatchTime, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(Event::getRealTime, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(Event::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo));
    }

    private void invalid(Event event, String reason) {
        throw new BusinessException("Evento " + event.getId() + ": " + reason);
    }

    private record State(MatchPlayerStatus status, Integer fieldSlot) {}
}
