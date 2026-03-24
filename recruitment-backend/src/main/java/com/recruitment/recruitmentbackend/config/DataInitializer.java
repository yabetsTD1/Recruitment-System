package com.recruitment.recruitmentbackend.config;

import com.recruitment.recruitmentbackend.entity.Role;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.RoleRepository;
import com.recruitment.recruitmentbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role superAdminRole = seedRole("SUPER_ADMIN");
        seedRole("ADMIN");
        seedRole("EMPLOYEE");

        if (!userRepository.existsByEmail("admin@insa.gov.et")) {
            User user = new User();
            user.setFullName("Super Admin");
            user.setUsername("superadmin");
            user.setEmail("admin@insa.gov.et");
            user.setPassword(passwordEncoder.encode("admin123"));
            user.setRole(superAdminRole);
            user.setStatus(User.UserStatus.ACTIVE);
            userRepository.save(user);
            System.out.println("✅ Super admin seeded: admin@insa.gov.et / admin123");
        }
    }

    private Role seedRole(String name) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role r = new Role(name);
            return roleRepository.save(r);
        });
    }
}
