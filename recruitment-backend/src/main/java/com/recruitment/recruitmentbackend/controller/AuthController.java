package com.recruitment.recruitmentbackend.controller;

import com.recruitment.recruitmentbackend.config.JwtUtil;
import com.recruitment.recruitmentbackend.entity.Role;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.RoleRepository;
import com.recruitment.recruitmentbackend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JwtDecoder jwtDecoder;

    @Data
    static class LoginRequest {
        @Email @NotBlank String email;
        @NotBlank String password;
    }

    // ── Local login (existing) ─────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }
        if (user.getStatus() == User.UserStatus.DISABLED) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is disabled. Contact admin."));
        }

        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "EMPLOYEE";
        String token = jwtUtil.generateToken(user.getEmail(), roleName);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "role", roleName,
                        "status", user.getStatus()
                )
        ));
    }

    // ── Keycloak token exchange ────────────────────────────────────────────────
    // Frontend sends the raw Keycloak access token; we validate it, extract the
    // role from realm_access.roles, auto-provision the user in our DB if needed,
    // and return the same shape as /login so the frontend works identically.

    @PostMapping("/keycloak")
    public ResponseEntity<?> keycloakLogin(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Missing token"));
        }
        String rawToken = authHeader.substring(7);

        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(rawToken);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid Keycloak token: " + e.getMessage()));
        }

        String email = jwt.getClaimAsString("email");
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        String fullName = jwt.getClaimAsString("name");
        if (fullName == null) fullName = preferredUsername;
        if (email == null) email = preferredUsername + "@keycloak.local";

        // Extract role from realm_access.roles
        String roleName = extractRole(jwt);

        // Auto-provision user in local DB if not present
        final String finalEmail = email;
        final String finalFullName = fullName;
        final String finalUsername = preferredUsername;
        final String finalRole = roleName;

        User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
            Role role = roleRepository.findByRoleName(finalRole)
                    .orElseGet(() -> roleRepository.findByRoleName("EMPLOYEE").orElseThrow());
            User newUser = new User();
            newUser.setEmail(finalEmail);
            newUser.setFullName(finalFullName != null ? finalFullName : finalEmail);
            newUser.setUsername(finalUsername != null ? finalUsername : finalEmail.split("@")[0]);
            newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            newUser.setRole(role);
            newUser.setStatus(User.UserStatus.ACTIVE);
            return userRepository.save(newUser);
        });

        if (user.getStatus() == User.UserStatus.DISABLED) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is disabled."));
        }

        // Return the Keycloak token directly — frontend stores it as-is
        return ResponseEntity.ok(Map.of(
                "token", rawToken,
                "user", Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "username", user.getUsername() != null ? user.getUsername() : "",
                        "email", user.getEmail(),
                        "role", roleName,
                        "status", user.getStatus()
                )
        ));
    }

    // ── /me endpoint ──────────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        // Try local token first
        if (jwtUtil.isTokenValid(token)) {
            String email = jwtUtil.extractEmail(token);
            return userRepository.findByEmail(email).map(user -> {
                String role = user.getRole() != null ? user.getRole().getRoleName() : "EMPLOYEE";
                return ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "role", role,
                        "status", user.getStatus()
                ));
            }).orElse(ResponseEntity.notFound().build());
        }

        // Try Keycloak token
        try {
            Jwt jwt = jwtDecoder.decode(token);
            String email = jwt.getClaimAsString("email");
            if (email == null) email = jwt.getClaimAsString("preferred_username") + "@keycloak.local";
            final String finalEmail = email;
            return userRepository.findByEmail(finalEmail).map(user -> {
                String role = user.getRole() != null ? user.getRole().getRoleName() : "EMPLOYEE";
                return ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "username", user.getUsername() != null ? user.getUsername() : "",
                        "email", user.getEmail(),
                        "role", role,
                        "status", user.getStatus()
                ));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String extractRole(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof List) {
                List<String> roles = (List<String>) rolesObj;
                // Priority: SUPER_ADMIN > ADMIN > EMPLOYEE
                if (roles.contains("SUPER_ADMIN")) return "SUPER_ADMIN";
                if (roles.contains("ADMIN")) return "ADMIN";
                if (roles.contains("EMPLOYEE")) return "EMPLOYEE";
            }
        }
        return "EMPLOYEE";
    }
}
