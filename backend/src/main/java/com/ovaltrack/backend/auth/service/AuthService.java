package com.ovaltrack.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.dto.RegistroRequest;

import com.ovaltrack.backend.auth.security.JwtService;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.Person;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;

import jakarta.transaction.Transactional;

@Service
public class AuthService {
    private final UserService userService;
    private final PersonService personService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService,
            PersonService personService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.personService = personService;
    }

    @Transactional
    public AuthResponse register(RegistroRequest request) {
        if (userService.existsByEmail(request.email())) {
            throw new BusinessException("The email is alredy registered");
        }
        Person person = Person.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .birthDate(request.birthDate())
                .contactEmail(request.email())
                .build();
        person = personService.savePersonEntity(person);

        String passwordHasheada = passwordEncoder.encode(request.password());
        User user = User.builder()
                .person(person)
                .loginEmail(request.email())
                .passwordHash(passwordHasheada)
                .role(request.role())
                .active(true)
                .build();

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
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Contraseña incorrecta");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }
}
