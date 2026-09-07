package com.ovaltrack.backend.common.config.exceptions;

/**
 * 
 * Exception related to business rules
 */
public class BusinessException extends IllegalArgumentException {

    /**
     * 
     * YEET
     */
    public BusinessException(String message) {
        super(message);
    }
}
