package com.recruitment.recruitmentbackend.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.recruitment.recruitmentbackend.config.JwtUtil;
import com.recruitment.recruitmentbackend.entity.Applicant;
import com.recruitment.recruitmentbackend.entity.Application;
import com.recruitment.recruitmentbackend.entity.JobQualification;
import com.recruitment.recruitmentbackend.entity.JobQualificationEntry;
import com.recruitment.recruitmentbackend.entity.Recruitment;
import com.recruitment.recruitmentbackend.entity.RecruitmentPost;
import com.recruitment.recruitmentbackend.repository.ApplicantRepository;
import com.recruitment.recruitmentbackend.repository.ApplicationRepository;
import com.recruitment.recruitmentbackend.repository.JobQualificationEntryRepository;
import com.recruitment.recruitmentbackend.repository.RecruitmentPostRepository;
import com.recruitment.recruitmentbackend.repository.RecruitmentRepository;
import com.recruitment.recruitmentbackend.repository.ApplicantEducationRepository;
import com.recruitment.recruitmentbackend.repository.ApplicantCertificationRepository;
import com.recruitment.recruitmentbackend.repository.ApplicantExperienceRepository;
import com.recruitment.recruitmentbackend.repository.ApplicantLanguageRepository;
import com.recruitment.recruitmentbackend.repository.ApplicantDocumentRepository;
import com.recruitment.recruitmentbackend.entity.ApplicantEducation;
import com.recruitment.recruitmentbackend.entity.ApplicantCertification;
import com.recruitment.recruitmentbackend.entity.ApplicantExperience;
import com.recruitment.recruitmentbackend.entity.ApplicantLanguage;
import com.recruitment.recruitmentbackend.entity.ApplicantDocument;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final RecruitmentRepository recruitmentRepository;
    private final RecruitmentPostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JobQualificationEntryRepository qualificationEntryRepository;
    private final JwtUtil jwtUtil;
    private final ApplicantEducationRepository educationRepository;
    private final ApplicantCertificationRepository certificationRepository;
    private final ApplicantExperienceRepository experienceRepository;
    private final ApplicantLanguageRepository languageRepository;
    private final ApplicantDocumentRepository documentRepository;

    @Data
    static class ApplyRequest {
        String firstName;
        String middleName;
        String lastName;
        String fullName;
        String email;
        String phone;
        String phoneNumber1;
        String phoneNumber2;
        String location;
        String residentialAddress;
        String gender;
        String maritalStatus;
        String dateOfBirth;
        String githubUrl;
        String linkedinUrl;
        String password;
        Integer recruitmentId;
    }

    // Public job listings — EXTERNAL posts (including Both)
    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs() {
        LocalDate now = LocalDate.now();
        List<?> jobs = postRepository.findAll().stream()
                .filter(p -> p.getPostType() == RecruitmentPost.PostType.EXTERNAL
                        && p.getRecruitment().getStatus() == Recruitment.RecruitmentStatus.POSTED
                        && (p.getClosingDate() == null || !p.getClosingDate().isBefore(now)))
                .map(p -> {
                    Recruitment r = p.getRecruitment();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("jobTitle", r.getJobTitle());
                    m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
                    m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
                    m.put("description", r.getDescription() != null ? r.getDescription() : "");
                    m.put("salary", r.getSalary() != null ? r.getSalary() : "");
                    m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
                    m.put("hiringType", r.getHiringType() != null ? r.getHiringType() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("deadline", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
                    m.put("recruitmentType", r.getRecruitmentType() != null ? r.getRecruitmentType() : "");
                    m.put("positionName", r.getPositionName() != null ? r.getPositionName() : "");
                    m.put("employmentType", r.getEmploymentType() != null ? r.getEmploymentType() : "");
                    return m;
                }).toList();
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<?> getJob(@PathVariable Integer id) {
        LocalDate now = LocalDate.now();
        // Find the EXTERNAL post for this recruitment
        return postRepository.findAll().stream()
                .filter(p -> p.getRecruitment().getId().equals(id)
                        && p.getPostType() == RecruitmentPost.PostType.EXTERNAL)
                .findFirst()
                .map(p -> {
                    Recruitment r = p.getRecruitment();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("jobTitle", r.getJobTitle());
                    m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
                    m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
                    m.put("description", r.getDescription() != null ? r.getDescription() : "");
                    m.put("salary", r.getSalary() != null ? r.getSalary() : "");
                    m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
                    m.put("hiringType", r.getHiringType() != null ? r.getHiringType() : "");
                    m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("deadline", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("recruitmentType", r.getRecruitmentType() != null ? r.getRecruitmentType() : "");
                    m.put("positionName", r.getPositionName() != null ? r.getPositionName() : "");
                    m.put("employmentType", r.getEmploymentType() != null ? r.getEmploymentType() : "");
                    m.put("competencyFramework", r.getCompetencyFramework() != null ? r.getCompetencyFramework() : "");
                    m.put("status", r.getStatus().name());
                    
                    // Add job qualification details if available
                    if (r.getJobQualification() != null) {
                        JobQualification jq = r.getJobQualification();
                        m.put("minDegree", jq.getMinDegree() != null ? jq.getMinDegree() : "");
                        m.put("minExperience", jq.getMinExperience() != null ? jq.getMinExperience() : "");
                        m.put("requiredSkills", jq.getRequiredSkills() != null ? jq.getRequiredSkills() : "");
                        m.put("competency", jq.getCompetencyFramework() != null ? jq.getCompetencyFramework() : "");
                        m.put("fullDescription", jq.getFullDescription() != null ? jq.getFullDescription() : "");
                        
                        // Fetch qualification entries
                        List<JobQualificationEntry> entries = qualificationEntryRepository.findByJobQualificationId(jq.getId());
                        List<Map<String, Object>> entriesList = entries.stream().map(entry -> {
                            Map<String, Object> entryMap = new HashMap<>();
                            entryMap.put("id", entry.getId());
                            entryMap.put("educationCategory", entry.getEducationCategory() != null ? entry.getEducationCategory() : "");
                            entryMap.put("educationLevel", entry.getEducationLevel() != null ? entry.getEducationLevel() : "");
                            entryMap.put("fieldOfStudy", entry.getFieldOfStudy() != null ? entry.getFieldOfStudy() : "");
                            entryMap.put("minExperience", entry.getMinExperience() != null ? entry.getMinExperience() : "");
                            entryMap.put("skill", entry.getSkill() != null ? entry.getSkill() : "");
                            entryMap.put("knowledge", entry.getKnowledge() != null ? entry.getKnowledge() : "");
                            entryMap.put("competency", entry.getCompetency() != null ? entry.getCompetency() : "");
                            return entryMap;
                        }).toList();
                        m.put("qualificationEntries", entriesList);
                    }
                    
                    return ResponseEntity.ok((Object) m);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // External application
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody ApplyRequest req) {
        Recruitment recruitment = recruitmentRepository.findById(req.getRecruitmentId())
                .orElse(null);
        if (recruitment == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Job not found."));
        }

        // Find or create applicant
        Applicant applicant = applicantRepository.findByEmail(req.getEmail()).orElseGet(() -> {
            Applicant a = new Applicant();
            a.setApplicantType(Applicant.ApplicantType.EXTERNAL);
            a.setEmail(req.getEmail());
            return a;
        });

        // Always update profile fields from the submitted form
        String first = req.getFirstName() != null ? req.getFirstName().trim() : "";
        String middle = req.getMiddleName() != null ? req.getMiddleName().trim() : "";
        String last = req.getLastName() != null ? req.getLastName().trim() : "";
        if (!first.isEmpty()) applicant.setFirstName(first);
        if (!middle.isEmpty()) applicant.setMiddleName(middle);
        if (!last.isEmpty()) applicant.setLastName(last);
        String composed = (first + " " + (middle.isEmpty() ? "" : middle + " ") + last).trim();
        if (!composed.isEmpty()) applicant.setFullName(composed);
        else if (req.getFullName() != null && !req.getFullName().isEmpty()) applicant.setFullName(req.getFullName());

        // Phone — support both field names
        String phone = req.getPhoneNumber1() != null ? req.getPhoneNumber1() : req.getPhone();
        if (phone != null && !phone.isEmpty()) applicant.setPhone(phone);

        // Location — support both field names
        String location = req.getResidentialAddress() != null ? req.getResidentialAddress() : req.getLocation();
        if (location != null && !location.isEmpty()) applicant.setLocation(location);

        if (req.getGender() != null && !req.getGender().isEmpty()) applicant.setGender(req.getGender());
        if (req.getGithubUrl() != null && !req.getGithubUrl().isEmpty()) applicant.setGithubUrl(req.getGithubUrl());
        if (req.getLinkedinUrl() != null && !req.getLinkedinUrl().isEmpty()) applicant.setLinkedinUrl(req.getLinkedinUrl());
        if (req.getMaritalStatus() != null && !req.getMaritalStatus().isEmpty())
            applicant.setOtherInfo("maritalStatus:" + req.getMaritalStatus() +
                (req.getDateOfBirth() != null ? ";dateOfBirth:" + req.getDateOfBirth() : "") +
                (req.getPhoneNumber2() != null ? ";phone2:" + req.getPhoneNumber2() : ""));

        // Set password only if not already set
        if (applicant.getPassword() == null && req.getPassword() != null && !req.getPassword().isEmpty()) {
            applicant.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        applicant.setApplicantType(Applicant.ApplicantType.EXTERNAL);
        applicantRepository.save(applicant);

        if (applicationRepository.existsByRecruitmentIdAndApplicantId(
                recruitment.getId(), applicant.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already applied."));
        }

        Application app = new Application();
        app.setRecruitment(recruitment);
        app.setApplicant(applicant);
        app.setApplicationStatus(Application.ApplicationStatus.SUBMITTED);
        applicationRepository.save(app);

        return ResponseEntity.ok(Map.of("message", "Application submitted successfully."));
    }

    // ── External Applicant: Update profile ──
    @Data
    static class UpdateProfileRequest {
        String email;
        String firstName;
        String middleName;
        String lastName;
        String phone;
        String phoneNumber1;
        String phoneNumber2;
        String location;
        String residentialAddress;
        String gender;
        String title;
        String maritalStatus;
        String dateOfBirth;
        String githubUrl;
        String linkedinUrl;
    }

    @org.springframework.web.bind.annotation.PutMapping("/applicant/update")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest req) {
        return applicantRepository.findByEmail(req.getEmail()).map(a -> {
            String first = req.getFirstName() != null ? req.getFirstName().trim() : "";
            String middle = req.getMiddleName() != null ? req.getMiddleName().trim() : "";
            String last = req.getLastName() != null ? req.getLastName().trim() : "";
            if (!first.isEmpty()) a.setFirstName(first);
            if (!middle.isEmpty()) a.setMiddleName(middle); else a.setMiddleName(null);
            if (!last.isEmpty()) a.setLastName(last);
            String composed = (first + " " + (middle.isEmpty() ? "" : middle + " ") + last).trim();
            if (!composed.isEmpty()) a.setFullName(composed);

            String phone = req.getPhoneNumber1() != null ? req.getPhoneNumber1() : req.getPhone();
            if (phone != null && !phone.isEmpty()) a.setPhone(phone);

            String location = req.getResidentialAddress() != null ? req.getResidentialAddress() : req.getLocation();
            if (location != null && !location.isEmpty()) a.setLocation(location);

            if (req.getGender() != null && !req.getGender().isEmpty()) a.setGender(req.getGender());
            if (req.getTitle() != null) a.setTitle(req.getTitle());
            if (req.getGithubUrl() != null) a.setGithubUrl(req.getGithubUrl());
            if (req.getLinkedinUrl() != null) a.setLinkedinUrl(req.getLinkedinUrl());

            // Store extra fields in otherInfo
            String phone2 = req.getPhoneNumber2() != null ? req.getPhoneNumber2() : "";
            String marital = req.getMaritalStatus() != null ? req.getMaritalStatus() : "";
            String dob = req.getDateOfBirth() != null ? req.getDateOfBirth() : "";
            a.setOtherInfo("maritalStatus:" + marital + ";dateOfBirth:" + dob + ";phone2:" + phone2);

            applicantRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── External Applicant: Check email ──
    @GetMapping("/applicant/check-email")
    public ResponseEntity<?> checkEmail(@org.springframework.web.bind.annotation.RequestParam String email) {
        boolean exists = applicantRepository.findByEmail(email).isPresent();
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // ── External Applicant: Register ──
    @Data
    static class RegisterRequest {
        String firstName;
        String middleName;
        String lastName;
        String email;
        String password;
        String phone;
    }

    @PostMapping("/applicant/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (applicantRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered. Please login."));
        }
        Applicant a = new Applicant();
        a.setApplicantType(Applicant.ApplicantType.EXTERNAL);
        String first = req.getFirstName() != null ? req.getFirstName().trim() : "";
        String middle = req.getMiddleName() != null ? req.getMiddleName().trim() : "";
        String last = req.getLastName() != null ? req.getLastName().trim() : "";
        a.setFirstName(first);
        a.setMiddleName(middle.isEmpty() ? null : middle);
        a.setLastName(last);
        a.setFullName((first + " " + (middle.isEmpty() ? "" : middle + " ") + last).trim());
        a.setEmail(req.getEmail());
        a.setPhone(req.getPhone());
        a.setPassword(passwordEncoder.encode(req.getPassword()));
        applicantRepository.save(a);

        String token = jwtUtil.generateToken(req.getEmail(), "EXTERNAL");
        return ResponseEntity.ok(Map.of("token", token, "message", "Registered successfully.", "isNew", true));
    }

    // ── External Applicant: Login ──
    @Data
    static class ExternalLoginRequest {
        String email;
        String password;
    }

    @PostMapping("/applicant/login")
    public ResponseEntity<?> externalLogin(@RequestBody ExternalLoginRequest req) {
        Applicant applicant = applicantRepository.findByEmail(req.getEmail()).orElse(null);
        if (applicant == null || applicant.getPassword() == null ||
                !passwordEncoder.matches(req.getPassword(), applicant.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }
        String token = jwtUtil.generateToken(req.getEmail(), "EXTERNAL");
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("applicantId", applicant.getId());
        resp.put("fullName", applicant.getFullName() != null ? applicant.getFullName() : "");
        resp.put("email", applicant.getEmail());
        resp.put("isNew", false);
        return ResponseEntity.ok(resp);
    }

    // ── External Applicant: Get profile ──
    @GetMapping("/applicant/profile")
    public ResponseEntity<?> getProfile(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("fullName", a.getFullName() != null ? a.getFullName() : "");

            // Use stored name parts; fall back to splitting fullName if parts are missing
            String firstName = a.getFirstName() != null && !a.getFirstName().isEmpty() ? a.getFirstName() : "";
            String middleName = a.getMiddleName() != null && !a.getMiddleName().isEmpty() ? a.getMiddleName() : "";
            String lastName = a.getLastName() != null && !a.getLastName().isEmpty() ? a.getLastName() : "";

            if (firstName.isEmpty() && a.getFullName() != null && !a.getFullName().isEmpty()) {
                String[] parts = a.getFullName().trim().split("\\s+");
                if (parts.length >= 1) firstName = parts[0];
                if (parts.length >= 3) { middleName = parts[1]; lastName = parts[2]; }
                else if (parts.length == 2) lastName = parts[1];
            }

            m.put("firstName", firstName);
            m.put("middleName", middleName);
            m.put("lastName", lastName);
            m.put("email", a.getEmail() != null ? a.getEmail() : "");
            m.put("phone", a.getPhone() != null ? a.getPhone() : "");
            m.put("gender", a.getGender() != null ? a.getGender() : "");
            m.put("title", a.getTitle() != null ? a.getTitle() : "");
            m.put("location", a.getLocation() != null ? a.getLocation() : "");
            m.put("githubUrl", a.getGithubUrl() != null ? a.getGithubUrl() : "");
            m.put("linkedinUrl", a.getLinkedinUrl() != null ? a.getLinkedinUrl() : "");
            m.put("gpa", a.getGpa());
            m.put("experienceYears", a.getExperienceYears());
            m.put("graduatedFrom", a.getGraduatedFrom() != null ? a.getGraduatedFrom() : "");
            m.put("nation", a.getNation() != null ? a.getNation() : "");

            // Parse extra fields stored in otherInfo
            String otherInfo = a.getOtherInfo() != null ? a.getOtherInfo() : "";
            String maritalStatus = "", dateOfBirth = "", phone2 = "";
            for (String part : otherInfo.split(";")) {
                if (part.startsWith("maritalStatus:")) maritalStatus = part.substring(14);
                else if (part.startsWith("dateOfBirth:")) dateOfBirth = part.substring(12);
                else if (part.startsWith("phone2:")) phone2 = part.substring(7);
            }
            m.put("maritalStatus", maritalStatus);
            m.put("dateOfBirth", dateOfBirth);
            m.put("phoneNumber2", phone2);
            return ResponseEntity.ok((Object) m);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── External Applicant: Get applications ──
    @GetMapping("/applicant/applications")
    public ResponseEntity<?> getApplications(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a -> {
            List<?> apps = applicationRepository.findByApplicantId(a.getId()).stream().map(app -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", app.getId());
                m.put("recruitmentId", app.getRecruitment().getId());
                m.put("jobTitle", app.getRecruitment().getJobTitle());
                m.put("department", app.getRecruitment().getDepartment() != null ? app.getRecruitment().getDepartment() : "");
                m.put("status", app.getApplicationStatus().name());
                m.put("appliedAt", app.getAppliedAt() != null ? app.getAppliedAt().toString() : "");
                // Get closing date from post
                postRepository.findAll().stream()
                    .filter(p -> p.getRecruitment().getId().equals(app.getRecruitment().getId()))
                    .findFirst()
                    .ifPresent(p -> m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : ""));
                if (!m.containsKey("closingDate")) m.put("closingDate", "");
                return m;
            }).toList();
            return ResponseEntity.ok(apps);
        }).orElse(ResponseEntity.ok(List.of()));
    }

    // ── Applicant Education CRUD ──

    @PostMapping("/applicant/education")
    public ResponseEntity<?> saveEducation(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        Applicant applicant = applicantRepository.findByEmail(email).orElse(null);
        if (applicant == null) return ResponseEntity.badRequest().body(Map.of("message", "Applicant not found"));

        Integer id = body.get("id") != null ? (Integer) body.get("id") : null;
        ApplicantEducation edu = id != null ? educationRepository.findById(id).orElse(new ApplicantEducation()) : new ApplicantEducation();
        edu.setApplicant(applicant);
        edu.setInstitution((String) body.getOrDefault("institution", ""));
        edu.setFieldOfStudy((String) body.getOrDefault("fieldOfStudy", ""));
        edu.setEducationLevel((String) body.getOrDefault("educationLevel", ""));
        edu.setStartDate((String) body.getOrDefault("startDate", ""));
        edu.setEndDate((String) body.getOrDefault("endDate", ""));
        edu.setPaidBy((String) body.getOrDefault("paidBy", ""));
        edu.setLocation((String) body.getOrDefault("location", ""));
        ApplicantEducation saved = educationRepository.save(edu);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Saved"));
    }

    @GetMapping("/applicant/education")
    public ResponseEntity<?> getEducation(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a ->
            ResponseEntity.ok(educationRepository.findByApplicantId(a.getId()).stream().map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", e.getId()); m.put("institution", e.getInstitution()); m.put("fieldOfStudy", e.getFieldOfStudy());
                m.put("educationLevel", e.getEducationLevel()); m.put("startDate", e.getStartDate()); m.put("endDate", e.getEndDate());
                m.put("paidBy", e.getPaidBy()); m.put("location", e.getLocation()); return m;
            }).toList())
        ).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/applicant/education/{id}")
    public ResponseEntity<?> deleteEducation(@PathVariable Integer id) {
        educationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Applicant Certification CRUD ──

    @PostMapping("/applicant/certification")
    public ResponseEntity<?> saveCertification(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        Applicant applicant = applicantRepository.findByEmail(email).orElse(null);
        if (applicant == null) return ResponseEntity.badRequest().body(Map.of("message", "Applicant not found"));

        Integer id = body.get("id") != null ? (Integer) body.get("id") : null;
        ApplicantCertification cert = id != null ? certificationRepository.findById(id).orElse(new ApplicantCertification()) : new ApplicantCertification();
        cert.setApplicant(applicant);
        cert.setProfessionalLicense((String) body.getOrDefault("professionalLicense", ""));
        cert.setInstitution((String) body.getOrDefault("institution", ""));
        cert.setSkills((String) body.getOrDefault("skills", ""));
        cert.setStartDate((String) body.getOrDefault("startDate", ""));
        cert.setEndDate((String) body.getOrDefault("endDate", ""));
        cert.setLocation((String) body.getOrDefault("location", ""));
        ApplicantCertification saved = certificationRepository.save(cert);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Saved"));
    }

    @GetMapping("/applicant/certification")
    public ResponseEntity<?> getCertification(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a ->
            ResponseEntity.ok(certificationRepository.findByApplicantId(a.getId()).stream().map(c -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", c.getId()); m.put("professionalLicense", c.getProfessionalLicense()); m.put("institution", c.getInstitution());
                m.put("skills", c.getSkills()); m.put("startDate", c.getStartDate()); m.put("endDate", c.getEndDate());
                m.put("location", c.getLocation()); return m;
            }).toList())
        ).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/applicant/certification/{id}")
    public ResponseEntity<?> deleteCertification(@PathVariable Integer id) {
        certificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Applicant Experience CRUD ──

    @PostMapping("/applicant/experience")
    public ResponseEntity<?> saveExperience(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        Applicant applicant = applicantRepository.findByEmail(email).orElse(null);
        if (applicant == null) return ResponseEntity.badRequest().body(Map.of("message", "Applicant not found"));

        Integer id = body.get("id") != null ? (Integer) body.get("id") : null;
        ApplicantExperience exp = id != null ? experienceRepository.findById(id).orElse(new ApplicantExperience()) : new ApplicantExperience();
        exp.setApplicant(applicant);
        exp.setJobTitle((String) body.getOrDefault("jobTitle", ""));
        exp.setInstitution((String) body.getOrDefault("institution", ""));
        exp.setOrganizationType((String) body.getOrDefault("organizationType", ""));
        exp.setEmploymentType((String) body.getOrDefault("employmentType", ""));
        exp.setResponsibility((String) body.getOrDefault("responsibility", ""));
        exp.setSalary((String) body.getOrDefault("salary", ""));
        exp.setStartDate((String) body.getOrDefault("startDate", ""));
        exp.setEndDate((String) body.getOrDefault("endDate", ""));
        exp.setTerminationReason((String) body.getOrDefault("terminationReason", ""));
        ApplicantExperience saved = experienceRepository.save(exp);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Saved"));
    }

    @GetMapping("/applicant/experience")
    public ResponseEntity<?> getExperience(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a ->
            ResponseEntity.ok(experienceRepository.findByApplicantId(a.getId()).stream().map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", e.getId()); m.put("jobTitle", e.getJobTitle()); m.put("institution", e.getInstitution());
                m.put("organizationType", e.getOrganizationType()); m.put("employmentType", e.getEmploymentType());
                m.put("responsibility", e.getResponsibility()); m.put("salary", e.getSalary());
                m.put("startDate", e.getStartDate()); m.put("endDate", e.getEndDate());
                m.put("terminationReason", e.getTerminationReason()); return m;
            }).toList())
        ).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/applicant/experience/{id}")
    public ResponseEntity<?> deleteExperience(@PathVariable Integer id) {
        experienceRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Applicant Language CRUD ──

    @PostMapping("/applicant/language")
    public ResponseEntity<?> saveLanguage(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        Applicant applicant = applicantRepository.findByEmail(email).orElse(null);
        if (applicant == null) return ResponseEntity.badRequest().body(Map.of("message", "Applicant not found"));

        Integer id = body.get("id") != null ? (Integer) body.get("id") : null;
        ApplicantLanguage lang = id != null ? languageRepository.findById(id).orElse(new ApplicantLanguage()) : new ApplicantLanguage();
        lang.setApplicant(applicant);
        lang.setLanguage((String) body.getOrDefault("language", ""));
        lang.setWriting((String) body.getOrDefault("writing", ""));
        lang.setListening((String) body.getOrDefault("listening", ""));
        lang.setReading((String) body.getOrDefault("reading", ""));
        lang.setSpeaking((String) body.getOrDefault("speaking", ""));
        ApplicantLanguage saved = languageRepository.save(lang);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Saved"));
    }

    @GetMapping("/applicant/language")
    public ResponseEntity<?> getLanguage(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a ->
            ResponseEntity.ok(languageRepository.findByApplicantId(a.getId()).stream().map(l -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", l.getId()); m.put("language", l.getLanguage()); m.put("writing", l.getWriting());
                m.put("listening", l.getListening()); m.put("reading", l.getReading()); m.put("speaking", l.getSpeaking());
                return m;
            }).toList())
        ).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/applicant/language/{id}")
    public ResponseEntity<?> deleteLanguage(@PathVariable Integer id) {
        languageRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Applicant Document CRUD ──

    @PostMapping(value = "/applicant/document", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadDocument(
            @org.springframework.web.bind.annotation.RequestParam("email") String email,
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        Applicant applicant = applicantRepository.findByEmail(email).orElse(null);
        if (applicant == null) return ResponseEntity.badRequest().body(Map.of("message", "Applicant not found"));
        try {
            ApplicantDocument doc = new ApplicantDocument();
            doc.setApplicant(applicant);
            doc.setFileName(file.getOriginalFilename());
            doc.setFileType(file.getContentType());
            doc.setFileData(file.getBytes());
            ApplicantDocument saved = documentRepository.save(doc);
            return ResponseEntity.ok(Map.of("id", saved.getId(), "fileName", saved.getFileName(), "fileType", saved.getFileType(), "message", "Uploaded"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/applicant/document")
    public ResponseEntity<?> getDocuments(@org.springframework.web.bind.annotation.RequestParam String email) {
        return applicantRepository.findByEmail(email).map(a ->
            ResponseEntity.ok(documentRepository.findByApplicantId(a.getId()).stream().map(d -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", d.getId());
                m.put("fileName", d.getFileName() != null ? d.getFileName() : "");
                m.put("fileType", d.getFileType() != null ? d.getFileType() : "");
                return m;
            }).toList())
        ).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applicant/document/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Integer id) {
        return documentRepository.findById(id).map(d -> {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentDispositionFormData("attachment", d.getFileName() != null ? d.getFileName() : "document");
            headers.setContentType(d.getFileType() != null
                ? org.springframework.http.MediaType.parseMediaType(d.getFileType())
                : org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            return ResponseEntity.ok().headers(headers).body(d.getFileData());
        }).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/applicant/document/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Integer id) {
        documentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
