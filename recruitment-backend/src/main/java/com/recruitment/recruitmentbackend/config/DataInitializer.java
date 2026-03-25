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
        Role adminRole = seedRole("ADMIN");
        seedRole("EMPLOYEE");

        // Delete and recreate admin user to ensure correct password
        userRepository.findByEmail("admin@insa.gov.et").ifPresent(userRepository::delete);
        
        User user = new User();
        user.setFullName("Super Admin");
        user.setUsername("superadmin");
        user.setEmail("admin@insa.gov.et");
        user.setPassword(passwordEncoder.encode("admin123"));
        user.setRole(superAdminRole);
        user.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(user);
        System.out.println("✅ Super admin seeded: admin@insa.gov.et / admin123");

        // Create default recruiter/admin user
        userRepository.findByEmail("tolman@gmail.com").ifPresent(userRepository::delete);
        
        User recruiter = new User();
        recruiter.setFullName("HR Recruiter");
        recruiter.setUsername("recruiter");
        recruiter.setEmail("tolman@gmail.com");
        recruiter.setPassword(passwordEncoder.encode("12345678"));
        recruiter.setRole(adminRole);
        recruiter.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(recruiter);
        System.out.println("✅ Recruiter seeded: tolman@gmail.com / 12345678");
    }

    private Role seedRole(String name) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role r = new Role(name);
            return roleRepository.save(r);
        });
    }
}
