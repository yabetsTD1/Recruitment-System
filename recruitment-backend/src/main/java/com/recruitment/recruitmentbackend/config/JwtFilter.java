package com.recruitment.recruitmentbackend.config;

import com.recruitment.recruitmentbackend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Handles locally-issued JWT tokens (from /api/auth/login).
 * Keycloak tokens are handled by the OAuth2 resource server configuration.
 * We detect Keycloak tokens by checking the issuer claim — if it matches
 * the Keycloak realm, we skip this filter and let Spring's resource server handle it.
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    private static final String KEYCLOAK_ISSUER = "http://localhost:9090/realms/recruitment-system";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            // Skip Keycloak tokens — they are handled by oauth2ResourceServer
            if (isKeycloakToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            // Handle locally-issued tokens
            if (jwtUtil.isTokenValid(token)) {
                String email = jwtUtil.extractEmail(token);
                String role  = jwtUtil.extractRole(token);

                userRepository.findByEmail(email).ifPresent(user -> {
                    if (user.getStatus() == com.recruitment.recruitmentbackend.entity.User.UserStatus.ACTIVE) {
                        var auth = new UsernamePasswordAuthenticationToken(
                                email, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                });
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Peek at the JWT payload to check if it was issued by Keycloak.
     * We do a simple Base64 decode of the payload — no signature verification here,
     * that's done by the OAuth2 resource server.
     */
    private boolean isKeycloakToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            return payload.contains(KEYCLOAK_ISSUER);
        } catch (Exception e) {
            return false;
        }
    }
}
