package com.ovaltrack.backend.auth.controller;

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
import com.ovaltrack.backend.common.dto.response.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registrar(@Valid @RequestBody RegistroRequest request) {
        AuthResponse response;
        try {
            response = authService.register(request);
        } catch (BusinessException e) {
            return (e.getMessage() != null) ? ApiResponse.response(HttpStatus.BAD_REQUEST, e.getMessage(), null)
                    : ApiResponse.response(HttpStatus.BAD_REQUEST, "", null);
        } catch (IllegalArgumentException e) {
            return ApiResponse.response(HttpStatus.BAD_REQUEST, "", null);
        }
        return ApiResponse.response(HttpStatus.CREATED, "OK", response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        AuthResponse response;
        try {
            response = authService.login(request);
        } catch (IllegalArgumentException e) {
            return ApiResponse.response(HttpStatus.BAD_REQUEST, "Credencial invalida", null);
        }
        return ApiResponse.ok(response);
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse<Void>> passwordReset(@RequestBody PasswordResetRequest request) {
        return ApiResponse.accepted("Solicitud enviada correctamente", null);
    }
}
