package com.diemdanh.config;

import com.diemdanh.service.JwtService;
import com.diemdanh.domain.UserEntity;
import com.diemdanh.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Skip JWT processing for public endpoints
        String requestPath = request.getRequestURI();
        log.info("JwtFilter: Processing request to {} (method: {})", requestPath, request.getMethod());

        boolean isPublicEndpoint = requestPath.startsWith("/api/auth/") ||
            requestPath.startsWith("/api/attendances") ||
            requestPath.startsWith("/api/face-proxy/") ||
            requestPath.equals("/api/sessions/validate") ||
            requestPath.equals("/api/sessions/current") ||
            requestPath.matches("/api/sessions/.*/activate-qr2") ||
            requestPath.matches("/api/sessions/.*/validate-qr") ||
            requestPath.matches("/api/sessions/.*/qr-a-access");
            
        log.info("JwtFilter: Path {} is public endpoint: {}", requestPath, isPublicEndpoint);

        if (isPublicEndpoint) {
            log.info("JwtFilter: Allowing public endpoint {}", requestPath);
            filterChain.doFilter(request, response);
            return;
        }

        // Check if Authorization header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT token
        jwt = authHeader.substring(7);

        try {
            // Extract username from JWT
            username = jwtService.extractUsername(jwt);
            logger.info("JWT Filter - Extracted username: " + username + " for path: " + requestPath);

            // If username exists and user is not already authenticated
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load user from database
                Optional<UserEntity> userOpt = userRepository.findByUsername(username);

                if (userOpt.isPresent()) {
                    UserEntity user = userOpt.get();
                    logger.info("JWT Filter - Found user: " + user.getUsername() + " with role: " + user.getRole() + " active: " + user.getIsActive());

                    // Validate token
                    if (jwtService.isTokenValid(jwt) && user.getIsActive()) {

                        // Create authorities based on user role
                        List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                        );
                        logger.info("JWT Filter - Created authorities: " + authorities);

                        // Create authentication token
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                user.getUsername(),  // Use username string instead of user object
                                null,
                                authorities
                        );

                        // Set authentication details
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // Set authentication in security context
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        logger.info("JWT Filter - Authentication set successfully for user: " + user.getUsername());
                    } else {
                        logger.warn("JWT Filter - Token invalid or user inactive for: " + user.getUsername());
                    }
                } else {
                    logger.warn("JWT Filter - User not found for username: " + username);
                }
            } else {
                logger.info("JWT Filter - Username null or already authenticated");
            }
        } catch (Exception e) {
            // Log error but don't block the request
            logger.warn("JWT authentication failed: " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}
