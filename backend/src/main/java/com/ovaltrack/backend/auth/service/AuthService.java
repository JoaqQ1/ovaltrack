package com.ovaltrack.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ovaltrack.backend.auth.dto.AuthResponse;
import com.ovaltrack.backend.auth.dto.LoginRequest;
import com.ovaltrack.backend.auth.dto.RegistroRequest;
import com.ovaltrack.backend.auth.model.Rol;
import com.ovaltrack.backend.auth.model.Usuario;
import com.ovaltrack.backend.auth.repository.UsuarioRepository;
import com.ovaltrack.backend.auth.security.JwtService;

import jakarta.transaction.Transactional;

@Service 
public class AuthService {
    private final UsuarioRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService( UsuarioRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService ){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }
    @Transactional 
    public AuthResponse register(RegistroRequest request){
        if(userRepository.existsByEmail(request.email())){
            throw new IllegalArgumentException("The email is alredy registered");
        }
        if(request.rol() != Rol.ADMIN_OVALTRACK && request.clubId() == null){
            throw new IllegalArgumentException("Los usuarios asignados a un club deben tener un clubId válido");
        }
        String passwordHasheada = passwordEncoder.encode(request.password());

        Usuario nuevoUsuario = new Usuario(
                null,
                request.email(),
                passwordHasheada,
                request.rol(),
                request.clubId(),
                request.divisionId()
        );

        Usuario guardado = userRepository.save(nuevoUsuario);
        String token = jwtService.generateToken(guardado);
        return new AuthResponse(token);
    }
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales incorrectas"));

        // Comprobación segura contra el hash
        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new IllegalArgumentException("Credenciales incorrectas");
        }
        String token = jwtService.generateToken(usuario);

        return new AuthResponse(token);
    }
}
