package com.diemdanh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "https://zettix.net",
                    "https://www.zettix.net",
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:8000",
                    "http://localhost:3000",
                    "http://127.0.0.1:8000",
                    "http://14.225.220.60:8000"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins including production domain
        configuration.setAllowedOrigins(Arrays.asList(
            "https://zettix.net",
            "https://www.zettix.net",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:8000",
            "http://localhost:3000",
            "http://127.0.0.1:8000",
            "http://14.225.220.60:8000"
        ));

        // Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));

        // Allow all headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials
        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
