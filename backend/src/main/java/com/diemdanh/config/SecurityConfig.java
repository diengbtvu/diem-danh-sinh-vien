package com.diemdanh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.cors.CorsConfigurationSource;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/attendances").permitAll() // Cho phép điểm danh không cần đăng nhập
                .requestMatchers("/api/face-proxy/**").permitAll() // Cho phép Face API proxy không cần đăng nhập
                .requestMatchers("/api/sessions/validate").permitAll() // Validate session token
                .requestMatchers("/api/sessions/current").permitAll() // Get current session
                .requestMatchers("/api/sessions/*/activate-qr2").permitAll() // Cho phép sinh viên kích hoạt QR B
                .requestMatchers("/api/sessions/*/validate-qr").permitAll() // Cho phép sinh viên validate QR B
                
                // Admin only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                
                // Giảng viên và Admin endpoints
                .requestMatchers("/api/sessions/**").hasAnyRole("ADMIN", "GIANGVIEN")
                .requestMatchers("/api/teacher/**").hasAnyRole("ADMIN", "GIANGVIEN")
                .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "GIANGVIEN")
                .requestMatchers("/api/integrations/**").hasAnyRole("ADMIN", "GIANGVIEN")
                
                // Tất cả các endpoint khác cần authentication
                .anyRequest().authenticated()
            );

        // Thêm JWT filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS configuration is handled by CorsConfig.java
}
