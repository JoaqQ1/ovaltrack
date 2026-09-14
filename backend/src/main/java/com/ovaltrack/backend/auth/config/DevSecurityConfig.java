package com.ovaltrack.backend.auth.config;

import com.ovaltrack.backend.auth.security.DevMockAuthFilter;
import com.ovaltrack.backend.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@Profile("dev")
public class DevSecurityConfig {

    private final DevMockAuthFilter devMockAuthFilter;
    private final JwtAuthenticationFilter jwtAuthFilter;

    public DevSecurityConfig(DevMockAuthFilter devMockAuthFilter,
                             JwtAuthenticationFilter jwtAuthFilter) {
        this.devMockAuthFilter = devMockAuthFilter;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(fl -> fl.disable())
                .httpBasic(hb -> hb.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(devMockAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}