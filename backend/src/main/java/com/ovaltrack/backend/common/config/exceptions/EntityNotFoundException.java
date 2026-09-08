package com.ovaltrack.backend.common.config.exceptions;

/**
 * 
 * Exception to be used when object in database was not found
 */
public class EntityNotFoundException extends IllegalArgumentException {
    
    /**
     * 
     * YEET
     */
    public EntityNotFoundException(String message) {
        super(message);
    }
}
