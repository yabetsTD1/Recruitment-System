package com.recruitment.recruitmentbackend.controller;

import com.recruitment.recruitmentbackend.config.JwtUtil;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Data
    static class LoginRequest {
        @Email @NotBlank String email;
        @NotBlank String password;
    }

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

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }
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
}
