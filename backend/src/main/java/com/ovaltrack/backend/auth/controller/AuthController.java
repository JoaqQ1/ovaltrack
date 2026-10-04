package com.ovaltrack.backend.auth.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.dto.PasswordResetRequest;
import com.ovaltrack.backend.auth.registration.domain.dto.RegistrationRequestDTO;
import com.ovaltrack.backend.auth.service.AuthService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.dto.response.BackendResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Registration, login, and password recovery")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Register a new user", description = "Creates a user account and registration request pending approval.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User registered successfully."),
            @ApiResponse(responseCode = "400", description = "The request contains invalid or incomplete data.")
    })
    @PostMapping("/register")
    public ResponseEntity<BackendResponse<Object>> registrar(@Valid @RequestBody RegistrationRequestDTO request,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors())
            return BackendResponse.badRequest("Campos inválidos", null);
        try {
            authService.register(request);
            return BackendResponse.response(
                HttpStatus.CREATED, 
                "Solicitud de registro creada con éxito. Pendiente de aprobación", 
                null
            );
        } catch (BusinessException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error en el registro";
            return BackendResponse.badRequest(errorMessage, null);
        } catch (IllegalArgumentException e) {
            return BackendResponse.badRequest("Datos inválidos", e);
        }
    }

    @Operation(summary = "Log in a user", description = "Authenticates the supplied credentials and returns a JWT token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Credentials accepted and token returned."),
            @ApiResponse(responseCode = "400", description = "The credentials are invalid.")
    })
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

    @Operation(summary = "Request a password reset", description = "Accepts a password reset request for the supplied email address.")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Password reset request accepted.")
    })
    @PostMapping("/password-reset/request")
    public ResponseEntity<Object> passwordReset(@RequestBody PasswordResetRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("message", "Solicitud enviada correctamente"));
    }
}