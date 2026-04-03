package com.recruitment.recruitmentbackend.service;

import com.recruitment.recruitmentbackend.dto.CreateUserRequest;
import com.recruitment.recruitmentbackend.entity.Role;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.RoleRepository;
import com.recruitment.recruitmentbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already exists.");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already exists.");
        }
        Role role = roleRepository.findByRoleName(req.getRoleName())
                .orElseGet(() -> roleRepository.findByRoleName("EMPLOYEE").orElseThrow());
        User user = new User();
        user.setFullName(req.getFullName());
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    public User toggleStatus(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setStatus(user.getStatus() == User.UserStatus.ACTIVE
                ? User.UserStatus.DISABLED : User.UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) throw new IllegalArgumentException("User not found.");
        userRepository.deleteById(id);
    }

    public User changeRole(Integer id, String roleName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        Role role = roleRepository.findByRoleName(roleName)
                .orElseGet(() -> roleRepository.findByRoleName("EMPLOYEE").orElseThrow());
        user.setRole(role);
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
