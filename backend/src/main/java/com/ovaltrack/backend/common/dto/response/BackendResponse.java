package com.ovaltrack.backend.common.dto.response;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BackendResponse<T> {
    private int status;
    private String message;
    private T data;

    public static <T> ResponseEntity<BackendResponse<T>> response(HttpStatus status, String message, T data) {
        BackendResponse<T> body = new BackendResponse<T>(status.value(), message, data);
        return new ResponseEntity<>(body, status);
    }

    public static <T> ResponseEntity<BackendResponse<T>> ok(T data) {
        return response(HttpStatus.OK, "OK", data);
    }

    public static <T> ResponseEntity<BackendResponse<T>> ok(T data, String message) {
        return response(HttpStatus.OK, message, data);
    }

    public static <T> ResponseEntity<BackendResponse<T>> notFound(String message) {
        return response(HttpStatus.NOT_FOUND, message, null);
    }

    public static <T> ResponseEntity<BackendResponse<T>> badRequest(String message, T errors) {
        return response(HttpStatus.BAD_REQUEST, message, errors);
    }

    public static <T> ResponseEntity<BackendResponse<T>> accepted(String message, T data) {
        return response(HttpStatus.ACCEPTED, message, data);
    }
}
