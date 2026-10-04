package com.ovaltrack.backend.common.config.exceptions;

import java.util.Date;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.ovaltrack.backend.common.dto.ErrorResponse;

import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(
                        DataIntegrityViolationException exception) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message",
                                                "No se pudo guardar la información porque viola una restricción de datos."));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken
                                || "anonymousUser".equals(auth.getPrincipal())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("message", "No autorizado: se requiere autenticación"));
                }
                String message = (ex.getMessage() != null && !ex.getMessage().equals("Access Denied")
                                && !ex.getMessage().isBlank())
                                                ? ex.getMessage()
                                                : "Acceso denegado: solo el administrador del club puede realizar esta acción";
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", message));
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<Map<String, String>> handleAuthenticationException(AuthenticationException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "No autorizado: se requiere autenticación"));
        }

        @ExceptionHandler(EntityNotFoundException.class)
        public ResponseEntity<Map<String, String>> handleEntityNotFound(EntityNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("message", ex.getMessage()));
        }

        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<Map<String, String>> handleBusinessException(BusinessException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message", ex.getMessage()));
        }

        @ExceptionHandler(UserDeactivatedException.class)
        public ResponseEntity<Map<String, String>> handleUserDeactivatedException(UserDeactivatedException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", ex.getMessage()));
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<Map<String, String>> handleHttpMessageNotReadable(
                        HttpMessageNotReadableException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("message", "El cuerpo de la solicitud no contiene un JSON válido."));
        }

        @ExceptionHandler(NoHandlerFoundException.class)
        public ResponseEntity<ErrorResponse> notFountException(NoHandlerFoundException ex) {
                ErrorResponse error = new ErrorResponse();
                error.setDate(new Date());
                error.setError("Api reste no encontrada");
                error.setMessage(ex.getMessage());
                error.setStatus(HttpStatus.NOT_FOUND.value());
                return ResponseEntity.status(HttpStatus.NOT_FOUND.value()).body(error);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
                        IllegalArgumentException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("message",
                                                ex.getMessage() != null ? ex.getMessage() : "Parámetro inválido."));
        }
}
