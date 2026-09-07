package com.ovaltrack.backend.auth.security;

import com.ovaltrack.backend.auth.model.Rol;
import com.ovaltrack.backend.auth.model.Usuario;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Profile("dev")
public class DevMockAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            // Usuario ficticio con permisos totales para facilitar pruebas en equipo
            Usuario mockPrincipal = new Usuario(
                    1L,
                    "dev@ovaltrack.com",
                    "contraseña",
                    Rol.ADMIN_OVALTRACK,
                    1L,
                    1L
            );

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + Rol.ADMIN_OVALTRACK.name()));
            var mockAuth = new UsernamePasswordAuthenticationToken(mockPrincipal, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(mockAuth);
        }

        filterChain.doFilter(request, response);
    }
}