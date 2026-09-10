package com.ovaltrack.backend.auth.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.dto.PasswordResetRequest;
import com.ovaltrack.backend.auth.dto.RegistroRequest;
import com.ovaltrack.backend.auth.service.AuthService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Object> registrar(@Valid @RequestBody RegistroRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (BusinessException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Error en el registro"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Datos inválidos"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Credencial inválida"));
        }
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Object> passwordReset(@RequestBody PasswordResetRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("message", "Solicitud enviada correctamente"));
    }
}