package com.ovaltrack.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.dto.RegistroRequest;

import com.ovaltrack.backend.auth.security.JwtService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;

import jakarta.transaction.Transactional;

@Service
public class AuthService {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegistroRequest request) {
        if (userService.existsByEmail(request.email())) {
            throw new BusinessException("The email is alredy registered");
        }

        String passwordHasheada = passwordEncoder.encode(request.password());
        User user = new User();
        user.setActive(true);
        user.setEmail(request.email());
        user.setPassword(passwordHasheada);
        user.setRole(request.role());
        user.setLastName(request.lastName());
        user.setFirstName(request.firstName());
        user.setBirthDate(request.birthDate());

        User guardado = userService.saveUser(user);
        String token = jwtService.generateToken(guardado);
        return new AuthResponse(token);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userService.findUserByEmail(request.email());
        if (user == null) {
            throw new BusinessException("El usuario con el email " + request.email() + " no existe");
        }

        // Comprobación segura contra el hash
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException("Contraseña incorrecta");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }
}
