package com.ovaltrack.backend.event.domain;

/** Qué equipo ejecuta el evento, relativo a quién tiene la pelota. */
public enum Actor {
    /** El equipo con la pelota. */
    ATTACKING,
    /** El equipo sin la pelota. */
    DEFENDING,
    /** El analista elige el equipo. */
    CHOOSE
}
