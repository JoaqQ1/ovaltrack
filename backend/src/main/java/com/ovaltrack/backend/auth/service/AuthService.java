package com.ovaltrack.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.dto.RegistroRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;
import com.ovaltrack.backend.auth.registration.service.RegistrationRequestService;
import com.ovaltrack.backend.auth.security.JwtService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import com.ovaltrack.backend.user.domain.UserStatus;

import jakarta.transaction.Transactional;

import com.ovaltrack.backend.common.config.exceptions.UserDeactivatedException;

@Service
public class AuthService {
    private final UserService userService;
    private final RegistrationRequestService registrationRequestService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RegistrationRequestService registrationRequestService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.registrationRequestService = registrationRequestService;
    }

    @Transactional
    public void register(RegistroRequest request) {
        
        if (userService.existsByEmail(request.email())) {
            throw new BusinessException("The email is alredy registered");
        }
        // 1. Crear el usuario en estado PENDING (sin darle rol efectivo aún)
        String passwordHasheada = passwordEncoder.encode(request.password());
        User user = User.builder()
                .loginEmail(request.email())
                .passwordHash(passwordHasheada)
                .role(UserRole.NO_ROLE)
                .build(); // El accountStatus por defecto se crea en PENDING_APPROVAL

        User savedUser = userService.saveUser(user);

        // 2. Crear la solicitud de registro vinculando al usuario y el rol solicitado
        RegistrationRequest registrationRequest = RegistrationRequest.builder()
                .user(savedUser)
                .requestedRole(request.role())
                .status(RegistrationRequestStatus.PENDING)
                .build();

        registrationRequestService.createRequest(registrationRequest);

    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userService.findUserByEmail(request.email());
        if (user == null) {
            throw new BusinessException("El usuario con el email " + request.email() + " no existe");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Contraseña incorrecta");
        }
        if (Boolean.FALSE.equals(user.getActive())) {
            throw new UserDeactivatedException("La cuenta todavia se encuentra inactiva.");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    public boolean validEmail(String email) {

        if (email == null || email.split("@").length != 2) {
            return false;
        }

        return true;
    }
}
