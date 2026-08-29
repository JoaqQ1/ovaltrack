package com.ovaltrack.backend.config; // <-- Debe estar dentro del paquete escaneado

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> customCorsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // 1. Permite cookies, autenticación HTTP y headers Authorization
        config.setAllowCredentials(true);
        
        // 2. Solo permite conexiones desde tu frontend en desarrollo
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        
        // 3. Permite cualquier header estándar o personalizado (JWT, Content-Type, etc.)
        config.setAllowedHeaders(List.of("*"));
        
        // 4. Permite todos los verbos HTTP REST
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 5. Aplica esta regla a TODAS las rutas del backend (incluyendo /api/** y /actuator/**)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        
        // 6. Se ejecuta en la entrada del servidor antes de cualquier otro filtro o controlador
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}