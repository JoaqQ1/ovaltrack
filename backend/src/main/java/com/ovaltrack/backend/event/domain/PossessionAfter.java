package com.ovaltrack.backend.event.domain;

/** Posesión resultante de un evento, relativa al equipo que lo ejecutó. */
public enum PossessionAfter {
    /** La posesión no cambia. */
    KEEP,
    /** Queda en el equipo que ejecutó el evento. */
    ACTOR,
    /** Pasa al rival del equipo que ejecutó el evento. */
    OTHER
}
