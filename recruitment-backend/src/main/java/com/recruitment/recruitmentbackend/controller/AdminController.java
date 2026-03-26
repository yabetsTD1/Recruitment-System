package com.recruitment.recruitmentbackend.controller;

import com.recruitment.recruitmentbackend.dto.CreateUserRequest;
import com.recruitment.recruitmentbackend.entity.JobQualification;
import com.recruitment.recruitmentbackend.entity.JobQualificationEntry;
import com.recruitment.recruitmentbackend.entity.JobType;
import com.recruitment.recruitmentbackend.entity.OrgUnit;
import com.recruitment.recruitmentbackend.entity.RegisteredJob;
import com.recruitment.recruitmentbackend.entity.Role;
import com.recruitment.recruitmentbackend.entity.SalarySetting;
import com.recruitment.recruitmentbackend.entity.SalaryStep;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.ApplicationRepository;
import com.recruitment.recruitmentbackend.repository.EmployeeRepository;
import com.recruitment.recruitmentbackend.repository.JobQualificationRepository;
import com.recruitment.recruitmentbackend.repository.JobQualificationEntryRepository;
import com.recruitment.recruitmentbackend.repository.JobTypeRepository;
import com.recruitment.recruitmentbackend.repository.OrgUnitRepository;
import com.recruitment.recruitmentbackend.repository.RecruitmentRepository;
import com.recruitment.recruitmentbackend.repository.RegisteredJobRepository;
import com.recruitment.recruitmentbackend.repository.RoleRepository;
import com.recruitment.recruitmentbackend.repository.SalarySettingRepository;
import com.recruitment.recruitmentbackend.repository.SalaryStepRepository;
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
    private final JobQualificationEntryRepository jobQualificationEntryRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final RegisteredJobRepository registeredJobRepository;
    private final SalarySettingRepository salarySettingRepository;
    private final SalaryStepRepository salaryStepRepository;

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
                "name", jt.getName(),
                "parentId", jt.getParentId() != null ? jt.getParentId() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/job-types")
    public ResponseEntity<?> createJobType(@RequestBody Map<String, Object> body) {
        JobType jt = new JobType();
        jt.setName((String) body.get("name"));
        Object pid = body.get("parentId");
        jt.setParentId((pid != null && !pid.toString().isEmpty()) ? Integer.parseInt(pid.toString()) : null);
        JobType saved = jobTypeRepository.save(jt);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "parentId", saved.getParentId() != null ? saved.getParentId() : ""
        ));
    }

    @PutMapping("/job-types/{id}")
    public ResponseEntity<?> updateJobType(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return jobTypeRepository.findById(id).map(jt -> {
            jt.setName((String) body.get("name"));
            Object pid = body.get("parentId");
            jt.setParentId((pid != null && !pid.toString().isEmpty()) ? Integer.parseInt(pid.toString()) : null);
            jobTypeRepository.save(jt);
            return ResponseEntity.ok(Map.of(
                    "id", jt.getId(),
                    "name", jt.getName(),
                    "parentId", jt.getParentId() != null ? jt.getParentId() : ""
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

    // ── Registered Jobs ────────────────────────────────────────────────────────

    @GetMapping("/registered-jobs")
    public ResponseEntity<?> getRegisteredJobs() {
        return ResponseEntity.ok(registeredJobRepository.findAll().stream().map(j -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", j.getId());
            m.put("name", j.getName());
            m.put("classCode", j.getClassCode() != null ? j.getClassCode() : "");
            m.put("jobTypeId", j.getJobType() != null ? j.getJobType().getId() : null);
            m.put("jobTypeName", j.getJobType() != null ? j.getJobType().getName() : "");
            return m;
        }).toList());
    }

    @PostMapping("/registered-jobs")
    public ResponseEntity<?> createRegisteredJob(@RequestBody Map<String, Object> body) {
        RegisteredJob j = new RegisteredJob();
        j.setName(body.getOrDefault("name", "").toString());
        j.setClassCode(body.getOrDefault("classCode", "").toString());
        Object jtId = body.get("jobTypeId");
        if (jtId != null && !jtId.toString().isEmpty()) {
            jobTypeRepository.findById(Integer.parseInt(jtId.toString())).ifPresent(j::setJobType);
        }
        RegisteredJob saved = registeredJobRepository.save(j);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "name", saved.getName()));
    }

    @PutMapping("/registered-jobs/{id}")
    public ResponseEntity<?> updateRegisteredJob(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return registeredJobRepository.findById(id).map(j -> {
            if (body.containsKey("name")) j.setName(body.get("name").toString());
            if (body.containsKey("classCode")) j.setClassCode(body.get("classCode").toString());
            Object jtId = body.get("jobTypeId");
            if (jtId != null && !jtId.toString().isEmpty()) {
                jobTypeRepository.findById(Integer.parseInt(jtId.toString())).ifPresent(j::setJobType);
            } else if (body.containsKey("jobTypeId")) {
                j.setJobType(null);
            }
            registeredJobRepository.save(j);
            return ResponseEntity.ok(Map.of("message", "Updated."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/registered-jobs/{id}")
    public ResponseEntity<?> deleteRegisteredJob(@PathVariable Integer id) {
        if (!registeredJobRepository.existsById(id)) return ResponseEntity.notFound().build();
        registeredJobRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    // ── Salary Settings (Pay Grade) ────────────────────────────────────────────

    @GetMapping("/salary-settings")
    public ResponseEntity<?> getSalarySettings() {
        return ResponseEntity.ok(salarySettingRepository.findAll().stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("classCode", s.getClassCode() != null ? s.getClassCode() : "");
            m.put("icf", s.getIcf() != null ? s.getIcf() : "");
            m.put("beginningSalary", s.getBeginningSalary() != null ? s.getBeginningSalary() : 0);
            m.put("maxSalary", s.getMaxSalary() != null ? s.getMaxSalary() : 0);
            List<Map<String, Object>> steps = salaryStepRepository
                    .findBySalarySettingIdOrderByIncrementStep(s.getId()).stream().map(st -> {
                        Map<String, Object> sm = new HashMap<>();
                        sm.put("id", st.getId());
                        sm.put("incrementStep", st.getIncrementStep() != null ? st.getIncrementStep() : 0);
                        sm.put("salary", st.getSalary() != null ? st.getSalary() : 0);
                        return sm;
                    }).toList();
            m.put("steps", steps);
            return m;
        }).toList());
    }

    @PostMapping("/salary-settings")
    public ResponseEntity<?> createSalarySetting(@RequestBody Map<String, Object> body) {
        SalarySetting s = new SalarySetting();
        s.setClassCode(body.getOrDefault("classCode", "").toString());
        s.setIcf(body.getOrDefault("icf", "").toString());
        s.setBeginningSalary(body.get("beginningSalary") != null ? Long.parseLong(body.get("beginningSalary").toString()) : 0L);
        s.setMaxSalary(body.get("maxSalary") != null ? Long.parseLong(body.get("maxSalary").toString()) : 0L);
        SalarySetting saved = salarySettingRepository.save(s);
        return ResponseEntity.ok(Map.of("id", saved.getId()));
    }

    @PutMapping("/salary-settings/{id}")
    public ResponseEntity<?> updateSalarySetting(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return salarySettingRepository.findById(id).map(s -> {
            if (body.containsKey("classCode")) s.setClassCode(body.get("classCode").toString());
            if (body.containsKey("icf")) s.setIcf(body.get("icf").toString());
            if (body.containsKey("beginningSalary")) s.setBeginningSalary(Long.parseLong(body.get("beginningSalary").toString()));
            if (body.containsKey("maxSalary")) s.setMaxSalary(Long.parseLong(body.get("maxSalary").toString()));
            salarySettingRepository.save(s);
            return ResponseEntity.ok(Map.of("message", "Updated."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/salary-settings/{id}")
    public ResponseEntity<?> deleteSalarySetting(@PathVariable Integer id) {
        if (!salarySettingRepository.existsById(id)) return ResponseEntity.notFound().build();
        salaryStepRepository.deleteBySalarySettingId(id);
        salarySettingRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    // ── Salary Steps ───────────────────────────────────────────────────────────

    @PostMapping("/salary-settings/{id}/steps")
    public ResponseEntity<?> addStep(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return salarySettingRepository.findById(id).map(s -> {
            SalaryStep st = new SalaryStep();
            st.setSalarySetting(s);
            st.setIncrementStep(body.get("incrementStep") != null ? Integer.parseInt(body.get("incrementStep").toString()) : 0);
            st.setSalary(body.get("salary") != null ? Long.parseLong(body.get("salary").toString()) : 0L);
            SalaryStep saved = salaryStepRepository.save(st);
            Map<String, Object> m = new HashMap<>();
            m.put("id", saved.getId());
            m.put("incrementStep", saved.getIncrementStep());
            m.put("salary", saved.getSalary());
            return ResponseEntity.ok((Object) m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/salary-steps/{stepId}")
    public ResponseEntity<?> updateStep(@PathVariable Integer stepId, @RequestBody Map<String, Object> body) {
        return salaryStepRepository.findById(stepId).map(st -> {
            if (body.containsKey("incrementStep")) st.setIncrementStep(Integer.parseInt(body.get("incrementStep").toString()));
            if (body.containsKey("salary")) st.setSalary(Long.parseLong(body.get("salary").toString()));
            salaryStepRepository.save(st);
            return ResponseEntity.ok(Map.of("message", "Updated."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/salary-steps/{stepId}")
    public ResponseEntity<?> deleteStep(@PathVariable Integer stepId) {
        if (!salaryStepRepository.existsById(stepId)) return ResponseEntity.notFound().build();
        salaryStepRepository.deleteById(stepId);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
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
            Object rjId = body.get("registeredJobId");
            if (rjId != null && !rjId.toString().isEmpty()) {
                registeredJobRepository.findById(Integer.parseInt(rjId.toString())).ifPresent(jq::setRegisteredJob);
            }
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

    // ── Job Qualification Entries ──────────────────────────────────────────────

    @GetMapping("/job-qualifications/{id}/entries")
    public ResponseEntity<?> getEntries(@PathVariable Integer id) {
        return ResponseEntity.ok(jobQualificationEntryRepository.findByJobQualificationId(id).stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", e.getId());
            m.put("educationCategory", e.getEducationCategory() != null ? e.getEducationCategory() : "");
            m.put("educationLevel", e.getEducationLevel() != null ? e.getEducationLevel() : "");
            m.put("fieldOfStudy", e.getFieldOfStudy() != null ? e.getFieldOfStudy() : "");
            m.put("minExperience", e.getMinExperience() != null ? e.getMinExperience() : "0");
            m.put("skill", e.getSkill() != null ? e.getSkill() : "");
            m.put("knowledge", e.getKnowledge() != null ? e.getKnowledge() : "");
            m.put("competency", e.getCompetency() != null ? e.getCompetency() : "");
            return m;
        }).toList());
    }

    @PostMapping("/job-qualifications/{id}/entries")
    public ResponseEntity<?> addEntry(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return jobQualificationRepository.findById(id).map(jq -> {
            JobQualificationEntry e = new JobQualificationEntry();
            e.setJobQualification(jq);
            e.setEducationCategory(body.getOrDefault("educationCategory", "").toString());
            e.setEducationLevel(body.getOrDefault("educationLevel", "").toString());
            e.setFieldOfStudy(body.getOrDefault("fieldOfStudy", "").toString());
            e.setMinExperience(body.getOrDefault("minExperience", "0").toString());
            e.setSkill(body.getOrDefault("skill", "").toString());
            e.setKnowledge(body.getOrDefault("knowledge", "").toString());
            e.setCompetency(body.getOrDefault("competency", "").toString());
            JobQualificationEntry saved = jobQualificationEntryRepository.save(e);
            return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Entry added."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/job-qualification-entries/{entryId}")
    public ResponseEntity<?> updateEntry(@PathVariable Integer entryId, @RequestBody Map<String, Object> body) {
        return jobQualificationEntryRepository.findById(entryId).map(e -> {
            if (body.containsKey("educationCategory")) e.setEducationCategory(body.get("educationCategory").toString());
            if (body.containsKey("educationLevel")) e.setEducationLevel(body.get("educationLevel").toString());
            if (body.containsKey("fieldOfStudy")) e.setFieldOfStudy(body.get("fieldOfStudy").toString());
            if (body.containsKey("minExperience")) e.setMinExperience(body.get("minExperience").toString());
            if (body.containsKey("skill")) e.setSkill(body.get("skill").toString());
            if (body.containsKey("knowledge")) e.setKnowledge(body.get("knowledge").toString());
            if (body.containsKey("competency")) e.setCompetency(body.get("competency").toString());
            jobQualificationEntryRepository.save(e);
            return ResponseEntity.ok(Map.of("message", "Updated."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/job-qualification-entries/{entryId}")
    public ResponseEntity<?> deleteEntry(@PathVariable Integer entryId) {
        if (!jobQualificationEntryRepository.existsById(entryId)) return ResponseEntity.notFound().build();
        jobQualificationEntryRepository.deleteById(entryId);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    private Map<String, Object> jqToMap(JobQualification jq) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", jq.getId());
        m.put("jobTypeId", jq.getJobType() != null ? jq.getJobType().getId() : null);
        m.put("jobTypeName", jq.getJobType() != null ? jq.getJobType().getName() : "");
        m.put("registeredJobId", jq.getRegisteredJob() != null ? jq.getRegisteredJob().getId() : null);
        m.put("registeredJobName", jq.getRegisteredJob() != null ? jq.getRegisteredJob().getName() : "");
        m.put("registeredJobClass", jq.getRegisteredJob() != null && jq.getRegisteredJob().getClassCode() != null ? jq.getRegisteredJob().getClassCode() : "");
        m.put("jobTitle", jq.getJobTitle() != null ? jq.getJobTitle() : "");
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
