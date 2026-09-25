package com.ovaltrack.backend.common.config.exceptions;

public class UserDeactivatedException extends RuntimeException {
    public UserDeactivatedException(String message) {
        super(message);
    }
}
