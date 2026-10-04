package com.ovaltrack.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.dto.RegistrationRequestDTO;
import com.ovaltrack.backend.auth.registration.service.AdminService;
import com.ovaltrack.backend.auth.security.JwtService;
import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.ClubStatus;
import com.ovaltrack.backend.club.domain.dto.ClubResponseDTO;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.user.business.UserService;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import com.ovaltrack.backend.user.domain.UserStatus;

import jakarta.transaction.Transactional;

import com.ovaltrack.backend.common.config.exceptions.UserDeactivatedException;

@Service
public class AuthService {
    private final UserService userService;
    private final AdminService registrationRequestService;
    private final ClubService clubService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AdminService registrationRequestService,
            ClubService clubService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.registrationRequestService = registrationRequestService;
        this.clubService = clubService;
    }

    @Transactional
    public void register(RegistrationRequestDTO request) {

        if (request.getRequestedRole() == UserRole.ADMIN_OVALTRACK) {
            throw new BusinessException("El rol ADMIN_OVALTRACK no puede solicitarse desde el registro público");
        }

        if (validateEmail(request.getEmail()))
            throw new BusinessException("The email is alredy registered");

        String passHash = passwordEncoder.encode(request.getPassword());
        User newUser = new User();
        newUser.setLoginEmail(request.getEmail());
        newUser.setPasswordHash(passHash);
        newUser.setActive(false);
        newUser.setAccountStatus(UserStatus.PENDING_APPROVAL);
        newUser.setRole(UserRole.NO_ROLE);

        RegistrationRequest registrationRequest = RegistrationRequestDTO.createRegistrationRequest(newUser,
                request.getRequestedRole(), request.getApplicantFirstName(), request.getApplicantLastName(),
                request.getApplicantBirthDate(), request.getRequestedClubName(), request.getRequestedClubCity(),
                request.getRequestedClubContactEmail(), request.getRequestedClubContactPhone(), request.getClubId());

        if (request.getRequestedRole() == UserRole.ADMIN_CLUB) {
            validateRequestAdminClub(registrationRequest);
        } else if (request.getRequestedRole() == UserRole.COACH_ANALYST) {
            validateRequestCoach(registrationRequest);
        }

        User userSaved = userService.saveUser(newUser);

        registrationRequest.setUser(userSaved);

        registrationRequestService.saveRequest(registrationRequest);

        // registrationRequestService.createRequest(registrationRequest);

        // Si es jugador busca a la persona que esta asociada al club

        // Si es entrenador cuando se apruebe lo asocio a una persona y a un coach

        // si es admin se crea el club y la persona

    }

    private boolean validateEmail(String email) {
        return this.userService.existsByEmail(email);
    }

    private void validateRequestAdminClub(RegistrationRequest request) {

        if (request.getRequestedRole() == UserRole.ADMIN_CLUB
                && (request.getRequestedClubName() == null || request.getRequestedClubName().isBlank()
                        || request.getRequestedClubCity() == null || request.getRequestedClubCity().isBlank())) {
            throw new BusinessException("El nombre y la región del club son obligatorios para solicitar el alta");
        }
    }

    private void validateRequestCoach(RegistrationRequest request) {

        if (request.getRequestedRole() == UserRole.COACH_ANALYST && request.getClubId() == null)
            throw new BusinessException("Debe seleccionar un club para solicitar acceso como entrenador");

        ClubResponseDTO club = clubService.findClubById(request.getClubId());

        if (club == null)
            throw new BusinessException("El club seleccionado no existe");

        if (club.status() != ClubStatus.ACTIVE)
            throw new BusinessException("El club seleccionado no está activo");
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
