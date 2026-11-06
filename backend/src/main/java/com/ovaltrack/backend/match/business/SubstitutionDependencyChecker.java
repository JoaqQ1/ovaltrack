package com.ovaltrack.backend.match.business;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchPlayer;

@Component
public class SubstitutionDependencyChecker {

    private final LineupReplayer lineupReplayer;

    public SubstitutionDependencyChecker(LineupReplayer lineupReplayer) {
        this.lineupReplayer = lineupReplayer;
    }

    public void validateChange(Match match, List<Event> currentEvents, Event target, Event replacement) {
        List<Event> original = activeEvents(currentEvents);
        List<Event> proposed = new ArrayList<>(original);
        proposed.removeIf(event -> sameEvent(event, target));
        if (replacement != null && Boolean.TRUE.equals(replacement.getActive())) {
            proposed.add(replacement);
        }

        lineupReplayer.replay(match, original);
        lineupReplayer.replay(match, proposed);

        Map<UUID, Integer> affected = new HashMap<>();
        for (Event event : original) {
            if (isSubstitution(event) || !isAfter(event, target)) {
                continue;
            }
            UUID playerId = playerId(match, event);
            if (playerId == null) {
                continue;
            }
            Set<UUID> before = lineupReplayer.playersOnFieldBefore(match, original, event);
            Set<UUID> after = lineupReplayer.playersOnFieldBefore(match, proposed, event);
            if (before.contains(playerId) && !after.contains(playerId)) {
                affected.merge(playerId, 1, Integer::sum);
            }
        }

        if (!affected.isEmpty()) {
            MatchPlayer player = match.getRoster().stream()
                    .filter(candidate -> affected.containsKey(candidate.getDivisionPlayer().getPerson().getId()))
                    .findFirst().orElse(null);
            if (player != null) {
                throw new BusinessException("No se puede modificar la sustitución: el jugador "
                        + player.getDivisionPlayer().getPerson().getFirstName() + " "
                        + player.getDivisionPlayer().getPerson().getLastName() + " (#" + player.getNumber()
                        + ") tiene " + affected.get(player.getDivisionPlayer().getPerson().getId())
                        + " eventos dependientes posteriores");
            }
        }
    }

    private List<Event> activeEvents(List<Event> events) {
        return events.stream().filter(event -> Boolean.TRUE.equals(event.getActive())).toList();
    }

    private boolean isSubstitution(Event event) {
        return event.getEventType() != null
                && "SUBSTITUTION".equals(event.getEventType().getCode())
                && event.getTeamPossession() == EventPossession.OWN;
    }

    private UUID playerId(Match match, Event event) {
        if (event.getPlayer() != null) {
            return event.getPlayer().getId();
        }
        Object raw = event.getAttributes() == null ? null : event.getAttributes().get("playerNumber");
        if (!(raw instanceof Number number)) {
            return null;
        }
        return match.getRoster().stream()
                .filter(player -> Integer.valueOf(number.intValue()).equals(player.getNumber()))
                .map(player -> player.getDivisionPlayer().getPerson().getId())
                .findFirst().orElse(null);
    }

    private boolean isAfter(Event event, Event target) {
        return eventComparator().compare(event, target) > 0;
    }

    private boolean sameEvent(Event left, Event right) {
        return left == right || (left != null && right != null && left.getId() != null
                && left.getId().equals(right.getId()));
    }

    private Comparator<Event> eventComparator() {
        return Comparator.comparing(Event::getAbsoluteMatchTime, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(Event::getRealTime, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(Event::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(event -> event.getId() == null ? "" : event.getId().toString());
    }
}
