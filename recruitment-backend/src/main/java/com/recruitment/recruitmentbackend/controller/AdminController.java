package com.recruitment.recruitmentbackend.controller;

import com.recruitment.recruitmentbackend.dto.CreateUserRequest;
import com.recruitment.recruitmentbackend.entity.JobQualification;
import com.recruitment.recruitmentbackend.entity.JobType;
import com.recruitment.recruitmentbackend.entity.OrgUnit;
import com.recruitment.recruitmentbackend.entity.Role;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.ApplicationRepository;
import com.recruitment.recruitmentbackend.repository.EmployeeRepository;
import com.recruitment.recruitmentbackend.repository.JobQualificationRepository;
import com.recruitment.recruitmentbackend.repository.JobTypeRepository;
import com.recruitment.recruitmentbackend.repository.OrgUnitRepository;
import com.recruitment.recruitmentbackend.repository.RecruitmentRepository;
import com.recruitment.recruitmentbackend.repository.RoleRepository;
import com.recruitment.recruitmentbackend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecruitmentRepository recruitmentRepository;
    private final ApplicationRepository applicationRepository;
    private final EmployeeRepository employeeRepository;
    private final JobTypeRepository jobTypeRepository;
    private final JobQualificationRepository jobQualificationRepository;
    private final OrgUnitRepository orgUnitRepository;

    // ── Users ──────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        List<?> users = userRepository.findAll().stream().map(u -> Map.of(
                "id", u.getId(),
                "fullName", u.getFullName(),
                "username", u.getUsername(),
                "email", u.getEmail(),
                "role", u.getRole() != null ? u.getRole().getRoleName() : "EMPLOYEE",
                "status", u.getStatus().name(),
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        )).toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists."));
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists."));
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

        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "fullName", saved.getFullName(),
                "email", saved.getEmail(),
                "role", role.getRoleName()
        ));
    }

    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<?> toggleUser(@PathVariable Integer id) {
        return userRepository.findById(id).map(user -> {
            user.setStatus(user.getStatus() == User.UserStatus.ACTIVE
                    ? User.UserStatus.DISABLED : User.UserStatus.ACTIVE);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("status", user.getStatus().name()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted."));
    }

    // ── Dashboard Stats ────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepository.count(),
                "totalRecruitments", recruitmentRepository.count(),
                "totalApplications", applicationRepository.count(),
                "totalEmployees", employeeRepository.count()
        ));
    }

    // ── Job Types ──────────────────────────────────────────────────────────────

    @GetMapping("/job-types")
    public ResponseEntity<?> getJobTypes() {
        List<?> result = jobTypeRepository.findAll().stream().map(jt -> Map.of(
                "id", jt.getId(),
                "name", jt.getName()
        )).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/job-types")
    public ResponseEntity<?> createJobType(@RequestBody Map<String, Object> body) {
        JobType jt = new JobType();
        jt.setName((String) body.get("name"));
        JobType saved = jobTypeRepository.save(jt);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "name", saved.getName()
        ));
    }

    @PutMapping("/job-types/{id}")
    public ResponseEntity<?> updateJobType(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return jobTypeRepository.findById(id).map(jt -> {
            jt.setName((String) body.get("name"));
            jobTypeRepository.save(jt);
            return ResponseEntity.ok(Map.of(
                    "id", jt.getId(),
                    "name", jt.getName()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/job-types/{id}")
    public ResponseEntity<?> deleteJobType(@PathVariable Integer id) {
        if (!jobTypeRepository.existsById(id)) return ResponseEntity.notFound().build();
        jobTypeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    // ── Employees ──────────────────────────────────────────────────────────────

    @GetMapping("/employees")
    public ResponseEntity<?> getEmployees() {
        List<?> result = employeeRepository.findAll().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", e.getId());
            m.put("employeeId", e.getEmployeeId());
            m.put("fullName", e.getFullName());
            m.put("email", e.getEmail());
            m.put("department", e.getDepartment() != null ? e.getDepartment() : "");
            m.put("position", e.getPosition() != null ? e.getPosition() : "");
            m.put("phone", e.getPhone() != null ? e.getPhone() : "");
            m.put("status", e.getStatus().name());
            m.put("contractEndDate", e.getContractEndDate() != null ? e.getContractEndDate().toString() : null);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/employees/contract-expiring")
    public ResponseEntity<?> getContractExpiringEmployees() {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate in30Days = today.plusDays(30);
        List<?> result = employeeRepository.findAll().stream()
                .filter(e -> e.getContractEndDate() != null)
                .filter(e -> !e.getContractEndDate().isAfter(in30Days))
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", e.getId());
                    m.put("employeeId", e.getEmployeeId());
                    m.put("fullName", e.getFullName());
                    m.put("email", e.getEmail());
                    m.put("department", e.getDepartment() != null ? e.getDepartment() : "");
                    m.put("position", e.getPosition() != null ? e.getPosition() : "");
                    m.put("phone", e.getPhone() != null ? e.getPhone() : "");
                    m.put("status", e.getStatus().name());
                    m.put("contractEndDate", e.getContractEndDate().toString());
                    m.put("expired", e.getContractEndDate().isBefore(today));
                    m.put("daysUntilExpiry", java.time.temporal.ChronoUnit.DAYS.between(today, e.getContractEndDate()));
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/employees/{id}/status")
    public ResponseEntity<?> updateEmployeeStatus(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return employeeRepository.findById(id).map(e -> {
            String status = body.get("status").toString();
            e.setStatus(com.recruitment.recruitmentbackend.entity.Employee.EmployeeStatus.valueOf(status));
            employeeRepository.save(e);
            return ResponseEntity.ok(Map.of("status", e.getStatus().name()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Organization Structure ─────────────────────────────────────────────────

    @GetMapping("/org-units")
    public ResponseEntity<?> getOrgUnits() {
        return ResponseEntity.ok(orgUnitRepository.findAll().stream().map(this::orgToMap).toList());
    }

    @PostMapping("/org-units")
    public ResponseEntity<?> createOrgUnit(@RequestBody Map<String, Object> body) {
        OrgUnit u = new OrgUnit();
        u.setName(body.getOrDefault("name", "").toString());
        u.setCode(body.getOrDefault("code", "").toString());
        u.setDescription(body.getOrDefault("description", "").toString());
        Object pid = body.get("parentId");
        u.setParentId((pid != null && !pid.toString().isEmpty()) ? Integer.parseInt(pid.toString()) : null);
        String type = body.getOrDefault("unitType", "DEPARTMENT").toString();
        u.setUnitType(OrgUnit.UnitType.valueOf(type));
        return ResponseEntity.ok(orgToMap(orgUnitRepository.save(u)));
    }

    @PutMapping("/org-units/{id}")
    public ResponseEntity<?> updateOrgUnit(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return orgUnitRepository.findById(id).map(u -> {
            if (body.containsKey("name")) u.setName(body.get("name").toString());
            if (body.containsKey("code")) u.setCode(body.get("code").toString());
            if (body.containsKey("description")) u.setDescription(body.get("description").toString());
            Object pid = body.get("parentId");
            u.setParentId((pid != null && !pid.toString().isEmpty()) ? Integer.parseInt(pid.toString()) : null);
            if (body.containsKey("unitType")) u.setUnitType(OrgUnit.UnitType.valueOf(body.get("unitType").toString()));
            return ResponseEntity.ok(orgToMap(orgUnitRepository.save(u)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/org-units/{id}")
    public ResponseEntity<?> deleteOrgUnit(@PathVariable Integer id) {
        if (!orgUnitRepository.existsById(id)) return ResponseEntity.notFound().build();
        // re-parent children to deleted node's parent
        orgUnitRepository.findById(id).ifPresent(u -> {
            orgUnitRepository.findByParentId(id).forEach(child -> {
                child.setParentId(u.getParentId());
                orgUnitRepository.save(child);
            });
        });
        orgUnitRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    private Map<String, Object> orgToMap(OrgUnit u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("name", u.getName());
        m.put("code", u.getCode() != null ? u.getCode() : "");
        m.put("description", u.getDescription() != null ? u.getDescription() : "");
        m.put("parentId", u.getParentId() != null ? u.getParentId() : null);
        m.put("unitType", u.getUnitType() != null ? u.getUnitType().name() : "DEPARTMENT");
        m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toLocalDate().toString() : "");
        return m;
    }

    // ── Job Qualifications ─────────────────────────────────────────────────────

    @GetMapping("/job-qualifications")
    public ResponseEntity<?> getJobQualifications() {
        return ResponseEntity.ok(jobQualificationRepository.findAll().stream().map(this::jqToMap).toList());
    }

    @PostMapping("/job-qualifications")
    public ResponseEntity<?> createJobQualification(@RequestBody Map<String, Object> body) {
        Integer jobTypeId = Integer.parseInt(body.get("jobTypeId").toString());
        return jobTypeRepository.findById(jobTypeId).map(jt -> {
            JobQualification jq = new JobQualification();
            jq.setJobType(jt);
            jq.setJobTitle(body.getOrDefault("jobTitle", "").toString());
            jq.setMinDegree(body.getOrDefault("minDegree", "").toString());
            jq.setMinExperience(body.getOrDefault("minExperience", "").toString());
            jq.setRequiredSkills(body.getOrDefault("requiredSkills", "").toString());
            jq.setGrade(body.getOrDefault("grade", "").toString());
            jq.setCompetencyFramework(body.getOrDefault("competencyFramework", "").toString());
            jq.setFullDescription(body.getOrDefault("fullDescription", "").toString());
            String status = body.getOrDefault("status", "DRAFT").toString();
            jq.setStatus(JobQualification.QualificationStatus.valueOf(status));
            return ResponseEntity.ok(jqToMap(jobQualificationRepository.save(jq)));
        }).orElse(ResponseEntity.badRequest().build());
    }

    @PutMapping("/job-qualifications/{id}")
    public ResponseEntity<?> updateJobQualification(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return jobQualificationRepository.findById(id).map(jq -> {
            if (body.containsKey("jobTypeId")) {
                Integer jobTypeId = Integer.parseInt(body.get("jobTypeId").toString());
                jobTypeRepository.findById(jobTypeId).ifPresent(jq::setJobType);
            }
            if (body.containsKey("jobTitle")) jq.setJobTitle(body.get("jobTitle").toString());
            if (body.containsKey("minDegree")) jq.setMinDegree(body.get("minDegree").toString());
            if (body.containsKey("minExperience")) jq.setMinExperience(body.get("minExperience").toString());
            if (body.containsKey("requiredSkills")) jq.setRequiredSkills(body.get("requiredSkills").toString());
            if (body.containsKey("grade")) jq.setGrade(body.get("grade").toString());
            if (body.containsKey("competencyFramework")) jq.setCompetencyFramework(body.get("competencyFramework").toString());
            if (body.containsKey("fullDescription")) jq.setFullDescription(body.get("fullDescription").toString());
            if (body.containsKey("status")) jq.setStatus(JobQualification.QualificationStatus.valueOf(body.get("status").toString()));
            return ResponseEntity.ok(jqToMap(jobQualificationRepository.save(jq)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/job-qualifications/{id}")
    public ResponseEntity<?> deleteJobQualification(@PathVariable Integer id) {
        if (!jobQualificationRepository.existsById(id)) return ResponseEntity.notFound().build();
        jobQualificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    private Map<String, Object> jqToMap(JobQualification jq) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", jq.getId());
        m.put("jobTypeId", jq.getJobType().getId());
        m.put("jobTypeName", jq.getJobType().getName());
        m.put("jobTitle", jq.getJobTitle());
        m.put("minDegree", jq.getMinDegree() != null ? jq.getMinDegree() : "");
        m.put("minExperience", jq.getMinExperience() != null ? jq.getMinExperience() : "");
        m.put("requiredSkills", jq.getRequiredSkills() != null ? jq.getRequiredSkills() : "");
        m.put("grade", jq.getGrade() != null ? jq.getGrade() : "");
        m.put("competencyFramework", jq.getCompetencyFramework() != null ? jq.getCompetencyFramework() : "");
        m.put("fullDescription", jq.getFullDescription() != null ? jq.getFullDescription() : "");
        m.put("status", jq.getStatus().name());
        return m;
    }
}
